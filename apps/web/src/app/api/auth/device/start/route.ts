import { randomUUID } from 'node:crypto'
import { deviceAuthRequest, getDb } from '@rageai/db'
import { z } from 'zod'
import { hmacIdentifier, userCode } from '@/lib/crypto'
import { appUrl } from '@/lib/env'
import { checkUpstash, checkWaf } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const startSchema = z.object({
  installId: z.string().uuid(),
  deviceLabel: z.string().trim().min(1).max(80),
})

export async function POST(request: Request) {
  const waf = await checkWaf(process.env.VERCEL_WAF_AUTH_RATE_LIMIT_ID, request)
  if (waf) {
    return waf
  }

  const limited = await checkUpstash(
    `device-start:${request.headers.get('x-forwarded-for') ?? 'unknown'}`,
    20,
    '1 h',
    'rage:auth:start',
  )
  if (limited) {
    return limited
  }

  const body = startSchema.safeParse(await request.json().catch(() => null))
  if (!body.success) {
    return Response.json({ ok: false, message: 'Invalid device auth request' }, { status: 400 })
  }

  const code = userCode()
  const deviceCode = randomUUID()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await getDb()
    .insert(deviceAuthRequest)
    .values({
      id: randomUUID(),
      deviceCodeHash: hmacIdentifier(deviceCode),
      userCodeHash: hmacIdentifier(code),
      installIdHash: hmacIdentifier(body.data.installId),
      deviceLabel: body.data.deviceLabel,
      expiresAt,
    })

  return Response.json({
    userCode: code,
    deviceCode,
    verificationUri: `${appUrl()}/auth/device?code=${encodeURIComponent(code)}`,
    expiresAt: expiresAt.toISOString(),
  })
}
