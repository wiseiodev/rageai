import { randomUUID } from 'node:crypto'
import {
  type PublicPublishPayload,
  type PublishBatchRequest,
  publishBatchRequestSchema,
  publishRequestSchema,
  type ShareUrl,
  type WindowKind,
} from '@rageai/core'
import { apiKey as apiKeyTable, getDb, leaderboardRow, rageProfile, submission } from '@rageai/db'
import { and, eq } from 'drizzle-orm'
import { hmacIdentifier, ipBucket } from '@/lib/crypto'
import { appUrl } from '@/lib/env'
import { checkUpstash, checkWaf } from '@/lib/rate-limit'

export const runtime = 'nodejs'

function reject(message: string, status = 400) {
  return Response.json({ ok: false, message }, { status })
}

function parsePublishBody(body: unknown): {
  publicPayloads: PublicPublishPayload[]
  privateAntiAbuse: PublishBatchRequest['privateAntiAbuse']
} | null {
  const batch = publishBatchRequestSchema.safeParse(body)
  if (batch.success) {
    return batch.data
  }

  const single = publishRequestSchema.safeParse(body)
  if (single.success) {
    return {
      publicPayloads: [single.data.publicPayload],
      privateAntiAbuse: single.data.privateAntiAbuse,
    }
  }

  return null
}

export async function POST(request: Request) {
  const token = request.headers.get('x-api-key')
  if (!token) {
    return reject('Missing publish token', 401)
  }

  const db = getDb()
  const [keyRecord] = await db
    .select()
    .from(apiKeyTable)
    .where(and(eq(apiKeyTable.key, hmacIdentifier(token)), eq(apiKeyTable.enabled, true)))
    .limit(1)

  if (!keyRecord) {
    return reject('Invalid publish token', 401)
  }

  const waf = await checkWaf(
    process.env.VERCEL_WAF_PUBLISH_RATE_LIMIT_ID,
    request,
    keyRecord.userId,
  )
  if (waf) {
    return waf
  }

  const parsed = parsePublishBody(await request.json().catch(() => null))
  if (!parsed) {
    return reject('Invalid publish payload')
  }

  const handles = new Set(parsed.publicPayloads.map((payload) => payload.handle))
  const hostApps = new Set(parsed.publicPayloads.map((payload) => payload.hostApp))
  if (handles.size !== 1 || hostApps.size !== parsed.publicPayloads.length) {
    return reject('Batch payload must use one handle and unique host apps')
  }
  const firstPayload = parsed.publicPayloads[0]
  if (!firstPayload) {
    return reject('Invalid publish payload')
  }

  const installIdHash = hmacIdentifier(parsed.privateAntiAbuse.installId)
  const metadata = keyRecord.metadata as { installIdHash?: string; scope?: string } | null
  if (metadata?.scope !== 'publish' || metadata.installIdHash !== installIdHash) {
    return reject('Publish token does not match this install', 403)
  }

  const ipHash = ipBucket(request, 'day')
  for (const limit of [
    [`account:${keyRecord.userId}`, 20, '1 d', 'rage:publish:account'],
    [`install:${installIdHash}`, 10, '1 d', 'rage:publish:install'],
    [`ip:${ipHash}`, 50, '1 d', 'rage:publish:ip'],
  ] as const) {
    const limited = await checkUpstash(limit[0], limit[1], limit[2], limit[3])
    if (limited) {
      return limited
    }
  }

  if (
    parsed.publicPayloads.some((payload) =>
      payload.windows.some((window) => window.ratePerThousandWords > 1000),
    )
  ) {
    return reject('Payload failed plausibility checks')
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(rageProfile)
      .values({
        userId: keyRecord.userId,
        handle: firstPayload.handle,
      })
      .onConflictDoUpdate({
        target: rageProfile.userId,
        set: {
          handle: firstPayload.handle,
          updatedAt: new Date(),
        },
      })

    for (const publicPayload of parsed.publicPayloads) {
      const submissionId = randomUUID()

      await tx.insert(submission).values({
        id: submissionId,
        userId: keyRecord.userId,
        installIdHash,
        ipBucketHash: ipHash,
        hostApp: publicPayload.hostApp,
        handle: publicPayload.handle,
        pluginVersion: publicPayload.pluginVersion,
        rulesetVersion: publicPayload.rulesetVersion,
        generatedAt: new Date(publicPayload.generatedAt),
        payload: publicPayload,
      })

      for (const window of publicPayload.windows) {
        await tx
          .insert(leaderboardRow)
          .values({
            id: randomUUID(),
            submissionId,
            userId: keyRecord.userId,
            installIdHash,
            handle: publicPayload.handle,
            hostApp: publicPayload.hostApp,
            window: window.window,
            windowStart: window.windowStart ? new Date(window.windowStart) : null,
            windowEnd: window.windowEnd ? new Date(window.windowEnd) : null,
            userMessageCount: window.userMessageCount,
            userWordCount: window.userWordCount,
            scoredProfanityCount: window.scoredProfanityCount,
            ratePerThousandWords: window.ratePerThousandWords.toFixed(2),
            topIntensity: window.topIntensity,
            rankEligible: window.rankEligible,
          })
          .onConflictDoUpdate({
            target: [
              leaderboardRow.userId,
              leaderboardRow.installIdHash,
              leaderboardRow.hostApp,
              leaderboardRow.window,
            ],
            set: {
              submissionId,
              handle: publicPayload.handle,
              windowStart: window.windowStart ? new Date(window.windowStart) : null,
              windowEnd: window.windowEnd ? new Date(window.windowEnd) : null,
              userMessageCount: window.userMessageCount,
              userWordCount: window.userWordCount,
              scoredProfanityCount: window.scoredProfanityCount,
              ratePerThousandWords: window.ratePerThousandWords.toFixed(2),
              topIntensity: window.topIntensity,
              rankEligible: window.rankEligible,
              hidden: false,
              updatedAt: new Date(),
            },
          })
      }
    }
  })

  const shareUrls: ShareUrl[] = []
  const shareWindows = new Set<WindowKind>(firstPayload.windows.map((window) => window.window))
  for (const window of shareWindows) {
    const [row] = await db
      .select({ id: leaderboardRow.id })
      .from(leaderboardRow)
      .where(
        and(
          eq(leaderboardRow.userId, keyRecord.userId),
          eq(leaderboardRow.installIdHash, installIdHash),
          eq(leaderboardRow.hostApp, firstPayload.hostApp),
          eq(leaderboardRow.window, window),
        ),
      )
      .limit(1)
    if (row) {
      shareUrls.push({
        window,
        url: `${appUrl()}/share/${row.id}`,
      })
    }
  }

  return Response.json({
    ok: true,
    message:
      parsed.publicPayloads.length === 1 ? 'Rage score published.' : 'Rage scores published.',
    leaderboardUrl: `${appUrl()}/leaderboard`,
    published: parsed.publicPayloads.map((payload) => payload.hostApp),
    shareUrls,
  })
}
