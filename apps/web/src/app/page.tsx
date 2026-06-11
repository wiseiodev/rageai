import type { Route } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, Td, Th } from '@/components/ui/table'
import { getLeaderboardRows } from '@/lib/leaderboard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const rows = await getLeaderboardRows('daily').catch(() => [])
  const topHost = rows[0]?.hostApp

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <section className="grid gap-3">
        <Badge className="w-fit">self-reported, aggregate-only</Badge>
        <div className="grid gap-2">
          <h1 className="max-w-3xl font-semibold text-4xl tracking-normal">
            Today&apos;s AI frustration weather
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600">
            Rage AI scans local Claude Code and Codex chats only after opt-in, keeps your stats
            private, and publishes aggregate leaderboard scores only when you approve the payload.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-xl">Daily leaderboard</h2>
                <p className="text-sm text-zinc-500">Ranked by swears per 1,000 user words.</p>
              </div>
              <Link className="text-sm text-zinc-600 underline" href="/leaderboard">
                All windows
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {rows.length > 0 ? (
              <Table>
                <thead>
                  <tr>
                    <Th>#</Th>
                    <Th>Handle</Th>
                    <Th>Host</Th>
                    <Th className="text-right">Rage/1k</Th>
                    <Th className="text-right">Words</Th>
                    <Th className="text-right">Share</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <Td>{row.rank}</Td>
                      <Td className="font-medium">{row.handle}</Td>
                      <Td>{row.hostApp}</Td>
                      <Td className="text-right">{row.ratePerThousandWords}</Td>
                      <Td className="text-right">{row.userWordCount}</Td>
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
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center text-zinc-500">
                No published rage yet. Suspiciously calm.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Mood read</h2>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-zinc-600">
              <p>
                {topHost
                  ? `${topHost} is testing everyone&apos;s patience today.`
                  : 'The tools are behaving, or everyone is bottling it up.'}
              </p>
              <p>
                Public rows never include exact words, raw transcripts, model names, or account IDs.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Install</h2>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-zinc-600">
              <p>Claude and Codex plugins both use the same local scanner and publish contract.</p>
              <Link className="font-medium text-zinc-950 underline" href="/install">
                Set up Rage
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
