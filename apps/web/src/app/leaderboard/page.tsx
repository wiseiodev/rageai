import type { Route } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, Td, Th } from '@/components/ui/table'
import { getLeaderboardRows } from '@/lib/leaderboard'

export const dynamic = 'force-dynamic'

const windows = ['daily', 'weekly', 'all_time'] as const

export default async function LeaderboardPage() {
  const groups = await Promise.all(
    windows.map(async (window) => ({
      window,
      rows: await getLeaderboardRows(window).catch(() => []),
    })),
  )

  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-4 py-8">
      <div>
        <h1 className="font-semibold text-3xl">Leaderboard</h1>
        <p className="text-zinc-600">Self-reported aggregate scores. Tiny samples do not rank.</p>
      </div>
      <div className="grid gap-5">
        {groups.map((group) => (
          <Card key={group.window}>
            <CardHeader>
              <h2 className="font-semibold capitalize">{group.window.replace('_', ' ')}</h2>
            </CardHeader>
            <CardContent>
              {group.rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className="min-w-[680px]">
                    <thead>
                      <tr>
                        <Th>#</Th>
                        <Th>Handle</Th>
                        <Th>Host</Th>
                        <Th className="text-right">Rage/1k</Th>
                        <Th className="text-right">Swears</Th>
                        <Th className="text-right">Words</Th>
                        <Th>Top</Th>
                        <Th className="text-right">Share</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => (
                        <tr key={row.id}>
                          <Td>{row.rank}</Td>
                          <Td className="font-medium">{row.handle}</Td>
                          <Td>{row.hostApp}</Td>
                          <Td className="text-right">{row.ratePerThousandWords}</Td>
                          <Td className="text-right">{row.scoredProfanityCount}</Td>
                          <Td className="text-right">{row.userWordCount}</Td>
                          <Td>{row.topIntensity ?? '-'}</Td>
                          <Td className="text-right">
                            <Link
                              className="text-zinc-600 underline"
                              href={`/share/${row.id}` as Route}
                            >
                              Open
                            </Link>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">No rankable rows yet.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
