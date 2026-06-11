import { deviceAuthRequest, getDb, rageProfile } from '@rageai/db'
import { and, eq, gt } from 'drizzle-orm'
import { z } from 'zod'
import { getAuth } from '@/lib/auth'
import { hmacIdentifier } from '@/lib/crypto'
import { adminLogins } from '@/lib/env'

export const runtime = 'nodejs'

const approveSchema = z.object({
  userCode: z.string().trim().min(4).max(12),
  handle: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/),
})

async function parseBody(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return request.json()
  }
  const formData = await request.formData()
  return Object.fromEntries(formData.entries())
}

export async function POST(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers })
  if (!session) {
    return Response.json({ ok: false, message: 'Sign in with GitHub first' }, { status: 401 })
  }

  const body = approveSchema.safeParse(await parseBody(request).catch(() => null))
  if (!body.success) {
    return Response.json({ ok: false, message: 'Invalid approval request' }, { status: 400 })
  }

  const db = getDb()
  const [pending] = await db
    .select()
    .from(deviceAuthRequest)
    .where(
      and(
        eq(deviceAuthRequest.userCodeHash, hmacIdentifier(body.data.userCode.toUpperCase())),
        eq(deviceAuthRequest.status, 'pending'),
        gt(deviceAuthRequest.expiresAt, new Date()),
      ),
    )
    .limit(1)

  if (!pending) {
    return Response.json(
      { ok: false, message: 'Device code not found or expired' },
      { status: 404 },
    )
  }

  await db
    .insert(rageProfile)
    .values({
      userId: session.user.id,
      handle: body.data.handle,
    })
    .onConflictDoUpdate({
      target: rageProfile.userId,
      set: {
        handle: body.data.handle,
        updatedAt: new Date(),
      },
    })

  await db
    .update(deviceAuthRequest)
    .set({
      status: 'approved',
      userId: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(deviceAuthRequest.id, pending.id))

  const isAdmin = adminLogins().has(session.user.name?.toLowerCase() ?? '')
  return Response.json({
    ok: true,
    message: isAdmin
      ? 'Device approved. Admin session detected.'
      : 'Device approved. Return to your terminal.',
  })
}
