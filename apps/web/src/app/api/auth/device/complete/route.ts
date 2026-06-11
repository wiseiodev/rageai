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
  const [approved] = await db
    .select()
    .from(deviceAuthRequest)
    .where(
      and(
        eq(deviceAuthRequest.deviceCodeHash, hmacIdentifier(body.data.deviceCode)),
        eq(deviceAuthRequest.installIdHash, installIdHash),
        eq(deviceAuthRequest.status, 'approved'),
        isNull(deviceAuthRequest.apiKeyId),
        gt(deviceAuthRequest.expiresAt, new Date()),
      ),
    )
    .limit(1)

  if (!approved?.userId) {
    return Response.json(
      { ok: false, message: 'Device is not approved or has expired' },
      { status: 404 },
    )
  }

  const token = randomToken('rage_sk')
  const apiKeyId = randomUUID()
  await db.insert(apiKeyTable).values({
    id: apiKeyId,
    name: approved.deviceLabel,
    prefix: 'rage_sk',
    key: hmacIdentifier(token),
    userId: approved.userId,
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
    .where(eq(deviceAuthRequest.id, approved.id))

  const [profile] = await db
    .select({ handle: rageProfile.handle })
    .from(rageProfile)
    .where(eq(rageProfile.userId, approved.userId))
    .limit(1)

  return Response.json({
    token,
    handle: profile?.handle,
  })
}
