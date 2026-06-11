import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { getPublicShareData } from '@/lib/share'
import { ShareComposer } from './share-composer'

export const dynamic = 'force-dynamic'

type SharePageProps = {
  params: Promise<{ rowId: string }>
}

function formatWindow(window: string): string {
  return window === 'all_time' ? 'all-time' : window
}

function formatHostApp(hostApp: string): string {
  return hostApp === 'claude' ? 'Claude' : 'Codex'
}

function formatRate(rate: number | string): string {
  const numericRate = typeof rate === 'number' ? rate : Number(rate)
  return Number.isFinite(numericRate) ? numericRate.toFixed(2).replace(/\.?0+$/u, '') : String(rate)
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { rowId } = await params
  const data = await getPublicShareData(rowId)

  if (!data) {
    return {
      title: 'Rage AI share',
    }
  }

  const title = `${data.handle}'s ${formatWindow(data.window)} Rage AI score`
  const description = data.scores
    .map((score) => `${formatHostApp(score.hostApp)} ${formatRate(score.ratePerThousandWords)}/1k`)
    .join(' vs ')
  const image = `/share/${data.rowId}/opengraph-image`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: data.shareUrl,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { rowId } = await params
  const data = await getPublicShareData(rowId)

  if (!data) {
    notFound()
  }

  return (
    <article className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <section className="grid gap-3">
        <Badge className="w-fit">aggregate-only share</Badge>
        <div className="grid gap-2">
          <h1 className="max-w-3xl font-semibold text-4xl tracking-normal">
            {data.handle}&apos;s {formatWindow(data.window)} AI frustration readout
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600">
            Public Rage AI scores never include raw transcripts, exact matched words, transcript
            paths, model names, raw IPs, or account identity.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="grid gap-5">
          <img
            alt={`${data.handle}'s Rage AI share card`}
            className="aspect-[1200/630] w-full rounded-md border border-zinc-200 bg-white object-cover shadow-sm"
            src={`/share/${data.rowId}/opengraph-image`}
          />

          <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-zinc-200 border-b bg-zinc-50 text-left text-zinc-500">
                  <th className="px-4 py-3 font-medium">Host</th>
                  <th className="px-4 py-3 text-right font-medium">Rage/1k</th>
                  <th className="px-4 py-3 text-right font-medium">Hits</th>
                  <th className="px-4 py-3 text-right font-medium">Words</th>
                  <th className="px-4 py-3 font-medium">Top</th>
                </tr>
              </thead>
              <tbody>
                {data.scores.map((score) => (
                  <tr className="border-zinc-100 border-b last:border-0" key={score.hostApp}>
                    <td className="px-4 py-3 font-medium">{formatHostApp(score.hostApp)}</td>
                    <td className="px-4 py-3 text-right">
                      {formatRate(score.ratePerThousandWords)}
                    </td>
                    <td className="px-4 py-3 text-right">{score.scoredProfanityCount}</td>
                    <td className="px-4 py-3 text-right">{score.userWordCount}</td>
                    <td className="px-4 py-3">{score.topIntensity ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="grid h-fit gap-4 rounded-md border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
          <div>
            <h2 className="font-semibold text-xl">Copy-ready post</h2>
            <p className="text-sm text-zinc-500">Choose the platform and tone.</p>
          </div>
          <ShareComposer
            handle={data.handle}
            scores={data.scores}
            shareUrl={data.shareUrl}
            window={data.window}
          />
        </aside>
      </section>
    </article>
  )
}
