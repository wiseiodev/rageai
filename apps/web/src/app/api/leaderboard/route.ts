import { getLeaderboardRows } from '@/lib/leaderboard'
import { checkWaf } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const waf = await checkWaf(process.env.VERCEL_WAF_LEADERBOARD_RATE_LIMIT_ID, request)
  if (waf) {
    return waf
  }

  const url = new URL(request.url)
  const window = url.searchParams.get('window')
  const safeWindow =
    window === 'weekly' || window === 'all_time' || window === 'daily' ? window : 'daily'

  try {
    return Response.json({ rows: await getLeaderboardRows(safeWindow) })
  } catch {
    return Response.json({ rows: [] })
  }
}
