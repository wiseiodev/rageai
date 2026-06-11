import { randomUUID } from 'node:crypto'
import { apiKey as apiKeyTable, deviceAuthRequest, getDb, rageProfile } from '@rageai/db'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { hmacIdentifier, randomToken } from '@/lib/crypto'

export const runtime = 'nodejs'

const completeSchema = z.object({
  deviceCode: z.string().uuid(),
  installId: z.string().uuid(),
})

export async function POST(request: Request) {
  const body = completeSchema.safeParse(await request.json().catch(() => null))
  if (!body.success) {
    return Response.json({ ok: false, message: 'Invalid completion request' }, { status: 400 })
  }

  const db = getDb()
  const installIdHash = hmacIdentifier(body.data.installId)
  const [requestRecord] = await db
    .select()
    .from(deviceAuthRequest)
    .where(
      and(
        eq(deviceAuthRequest.deviceCodeHash, hmacIdentifier(body.data.deviceCode)),
        eq(deviceAuthRequest.installIdHash, installIdHash),
        isNull(deviceAuthRequest.apiKeyId),
        gt(deviceAuthRequest.expiresAt, new Date()),
      ),
    )
    .limit(1)

  if (!requestRecord) {
    return Response.json(
      { ok: false, message: 'Device auth request has expired or was already completed' },
      { status: 404 },
    )
  }

  if (requestRecord.status !== 'approved' || !requestRecord.userId) {
    return Response.json(
      {
        ok: false,
        message: 'Device is waiting for browser approval',
        status: requestRecord.status,
      },
      { status: 202 },
    )
  }

  const token = randomToken('rage_sk')
  const apiKeyId = randomUUID()
  await db.insert(apiKeyTable).values({
    id: apiKeyId,
    name: requestRecord.deviceLabel,
    prefix: 'rage_sk',
    key: hmacIdentifier(token),
    userId: requestRecord.userId,
    metadata: {
      installIdHash,
      scope: 'publish',
    },
  })

  await db
    .update(deviceAuthRequest)
    .set({
      apiKeyId,
      updatedAt: new Date(),
    })
    .where(eq(deviceAuthRequest.id, requestRecord.id))

  const [profile] = await db
    .select({ handle: rageProfile.handle })
    .from(rageProfile)
    .where(eq(rageProfile.userId, requestRecord.userId))
    .limit(1)

  return Response.json({
    token,
    handle: profile?.handle,
  })
}
