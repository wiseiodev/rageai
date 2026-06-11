import { randomUUID } from 'node:crypto'
import { getDb, leaderboardRow, moderationAction } from '@rageai/db'
import { eq } from 'drizzle-orm'
import { getAuth } from '@/lib/auth'
import { adminLogins } from '@/lib/env'
import { checkWaf } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAuth().api.getSession({ headers: request.headers })
  const login = session?.user.name?.toLowerCase() ?? ''
  if (!session || !adminLogins().has(login)) {
    return Response.json({ ok: false, message: 'Not found' }, { status: 404 })
  }

  const waf = await checkWaf(process.env.VERCEL_WAF_ADMIN_RATE_LIMIT_ID, request, session.user.id)
  if (waf) {
    return waf
  }

  const { id } = await context.params
  const db = getDb()
  await db
    .update(leaderboardRow)
    .set({ hidden: true, updatedAt: new Date() })
    .where(eq(leaderboardRow.id, id))
  await db.insert(moderationAction).values({
    id: randomUUID(),
    adminUserId: session.user.id,
    targetType: 'score',
    targetId: id,
    action: 'hide',
  })

  return Response.json({ ok: true, message: 'Score hidden' })
}
