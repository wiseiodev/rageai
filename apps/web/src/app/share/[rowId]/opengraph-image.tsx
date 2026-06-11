import { ImageResponse } from 'next/og'
import { getPublicShareData } from '@/lib/share'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

type ShareImageProps = {
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

export default async function Image({ params }: ShareImageProps) {
  const { rowId } = await params
  const data = await getPublicShareData(rowId)

  if (!data) {
    return new ImageResponse(
      <div
        style={{
          alignItems: 'center',
          background: '#f7f7f4',
          color: '#18181b',
          display: 'flex',
          fontFamily: 'Arial, Helvetica, sans-serif',
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700 }}>Rage AI</div>
      </div>,
      size,
    )
  }

  const scores = data.scores.slice(0, 2)
  const firstScore = scores[0] ?? data.scores[0]
  const leader = firstScore
    ? scores.reduce((best, score) => {
        const bestRate = Number(best.ratePerThousandWords)
        const scoreRate = Number(score.ratePerThousandWords)
        return scoreRate > bestRate ? score : best
      }, firstScore)
    : null
  const title =
    scores.length > 1
      ? 'Claude vs Codex frustration readout'
      : firstScore
        ? `${formatHostApp(firstScore.hostApp)} frustration readout`
        : 'AI frustration readout'

  return new ImageResponse(
    <div
      style={{
        background: '#f7f7f4',
        color: '#18181b',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, Helvetica, sans-serif',
        height: '100%',
        justifyContent: 'space-between',
        padding: 56,
        width: '100%',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <div
          style={{
            background: '#18181b',
            borderRadius: 8,
            color: 'white',
            fontSize: 28,
            fontWeight: 700,
            padding: '12px 18px',
          }}
        >
          Rage AI
        </div>
        <div style={{ color: '#52525b', fontSize: 28 }}>
          {formatWindow(data.window)} aggregate share
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ color: '#52525b', fontSize: 34 }}>{data.handle}</div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {scores.map((score) => (
          <div
            key={score.hostApp}
            style={{
              background: 'white',
              border: '2px solid #e4e4e7',
              borderRadius: 8,
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              gap: 10,
              padding: 26,
            }}
          >
            <div style={{ color: '#52525b', fontSize: 28 }}>{formatHostApp(score.hostApp)}</div>
            <div style={{ color: '#16a34a', fontSize: 66, fontWeight: 800 }}>
              {formatRate(score.ratePerThousandWords)}
            </div>
            <div style={{ color: '#52525b', fontSize: 28 }}>rage hits per 1,000 words</div>
          </div>
        ))}
      </div>

      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ color: '#52525b', fontSize: 26 }}>
          No raw transcripts. No matched words. No model names.
        </div>
        <div style={{ color: '#f97316', fontSize: 28, fontWeight: 700 }}>
          {leader ? `${formatHostApp(leader.hostApp)} leads` : 'Local-first'}
        </div>
      </div>
    </div>,
    size,
  )
}
