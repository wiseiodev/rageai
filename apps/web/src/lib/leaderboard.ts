import { getDb, leaderboardRow } from '@rageai/db'
import { and, desc, eq } from 'drizzle-orm'

export type PublicLeaderboardRow = {
  id: string
  rank: number
  handle: string
  hostApp: 'claude' | 'codex'
  window: 'daily' | 'weekly' | 'all_time'
  userWordCount: number
  scoredProfanityCount: number
  ratePerThousandWords: string
  topIntensity: 'mild' | 'standard' | 'strong' | null
}

export async function getLeaderboardRows(
  window: 'daily' | 'weekly' | 'all_time' = 'daily',
  limit = 25,
): Promise<PublicLeaderboardRow[]> {
  const rows = await getDb()
    .select()
    .from(leaderboardRow)
    .where(
      and(
        eq(leaderboardRow.window, window),
        eq(leaderboardRow.rankEligible, true),
        eq(leaderboardRow.hidden, false),
      ),
    )
    .orderBy(desc(leaderboardRow.ratePerThousandWords))
    .limit(limit)

  return rows.map((row, index) => ({
    id: row.id,
    rank: index + 1,
    handle: row.handle,
    hostApp: row.hostApp,
    window: row.window,
    userWordCount: row.userWordCount,
    scoredProfanityCount: row.scoredProfanityCount,
    ratePerThousandWords: row.ratePerThousandWords,
    topIntensity: row.topIntensity,
  }))
}
