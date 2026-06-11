import type { ShareScore, WindowKind } from '@rageai/core/share'
import { getDb, leaderboardRow } from '@rageai/db'
import { and, eq } from 'drizzle-orm'
import { appUrl } from './env'

export type PublicShareData = {
  rowId: string
  handle: string
  window: WindowKind
  shareUrl: string
  scores: ShareScore[]
}

function toShareScore(row: typeof leaderboardRow.$inferSelect): ShareScore {
  return {
    hostApp: row.hostApp,
    ratePerThousandWords: row.ratePerThousandWords,
    userWordCount: row.userWordCount,
    scoredProfanityCount: row.scoredProfanityCount,
    topIntensity: row.topIntensity,
    rankEligible: row.rankEligible,
  }
}

export async function getPublicShareData(rowId: string): Promise<PublicShareData | null> {
  const db = getDb()
  const [targetRow] = await db
    .select()
    .from(leaderboardRow)
    .where(and(eq(leaderboardRow.id, rowId), eq(leaderboardRow.hidden, false)))
    .limit(1)

  if (!targetRow) {
    return null
  }

  const siblingRows = await db
    .select()
    .from(leaderboardRow)
    .where(
      and(
        eq(leaderboardRow.userId, targetRow.userId),
        eq(leaderboardRow.installIdHash, targetRow.installIdHash),
        eq(leaderboardRow.window, targetRow.window),
        eq(leaderboardRow.hidden, false),
      ),
    )

  const scores = siblingRows
    .sort((left, right) => left.hostApp.localeCompare(right.hostApp))
    .map(toShareScore)

  return {
    rowId: targetRow.id,
    handle: targetRow.handle,
    window: targetRow.window,
    shareUrl: `${appUrl()}/share/${targetRow.id}`,
    scores,
  }
}
