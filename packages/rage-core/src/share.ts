import type { HostApp, ProfanityIntensity, WindowKind } from './types.js'

export type { WindowKind } from './types.js'

export type SharePlatform = 'x' | 'linkedin'
export type ShareTone = 'professional' | 'snark'

export type ShareScore = {
  hostApp: HostApp
  ratePerThousandWords: number | string
  userWordCount: number
  scoredProfanityCount: number
  topIntensity: ProfanityIntensity | null
  rankEligible: boolean
}

export type ShareDraftInput = {
  handle: string
  platform: SharePlatform
  tone: ShareTone
  window: WindowKind
  url: string
  scores: ShareScore[]
}

export type ShareDraft = {
  platform: SharePlatform
  tone: ShareTone
  text: string
  url: string
  characterCount: number
}

export type ShareUrl = {
  window: WindowKind
  url: string
}

function formatHostApp(hostApp: HostApp): string {
  return hostApp === 'claude' ? 'Claude' : 'Codex'
}

function formatWindow(window: WindowKind): string {
  if (window === 'all_time') {
    return 'all-time'
  }
  return window
}

function formatRate(rate: number | string): string {
  const numericRate = typeof rate === 'number' ? rate : Number(rate)
  if (!Number.isFinite(numericRate)) {
    return String(rate)
  }
  return numericRate.toFixed(2).replace(/\.?0+$/u, '')
}

function uniqueScores(scores: ShareScore[]): ShareScore[] {
  const byHost = new Map<HostApp, ShareScore>()
  for (const score of scores) {
    if (!byHost.has(score.hostApp)) {
      byHost.set(score.hostApp, score)
    }
  }
  return [...byHost.values()].sort((left, right) => left.hostApp.localeCompare(right.hostApp))
}

function bestScore(scores: ShareScore[]): ShareScore {
  return scores.reduce((best, score) => {
    const bestRate = Number(best.ratePerThousandWords)
    const scoreRate = Number(score.ratePerThousandWords)
    return scoreRate > bestRate ? score : best
  }, scores[0] as ShareScore)
}

function formatScore(score: ShareScore): string {
  return `${formatHostApp(score.hostApp)} ${formatRate(score.ratePerThousandWords)}/1k`
}

function scoreBoundary(score: ShareScore): string {
  return score.rankEligible ? 'rankable, aggregate-only' : 'aggregate-only'
}

function scoreBoundaryStart(score: ShareScore): string {
  return score.rankEligible ? 'Rankable, aggregate-only' : 'Aggregate-only'
}

function shareBoundarySentence(score: ShareScore): string {
  return score.rankEligible
    ? 'This is a rankable, aggregate-only share.'
    : 'This is an aggregate-only share.'
}

function comparisonLine(scores: ShareScore[]): string {
  return scores.map(formatScore).join(' vs ')
}

function createComparisonDraft(input: ShareDraftInput, scores: ShareScore[]): string {
  const leader = bestScore(scores)
  const window = formatWindow(input.window)
  const comparison = comparisonLine(scores)

  if (input.platform === 'x') {
    if (input.tone === 'snark') {
      return `${formatHostApp(leader.hostApp)} is leading my ${window} AI frustration derby: ${comparison}. Aggregate-only Rage AI, transcripts stay local. ${input.url}`
    }
    return `${window} Claude vs Codex rage check: ${comparison}. Aggregate-only Rage AI score, transcripts stay local. ${input.url}`
  }

  if (input.tone === 'snark') {
    return `My ${window} Rage AI readout has ${formatHostApp(
      leader.hostApp,
    )} causing the louder keyboard sigh: ${comparison}.\n\nIt is aggregate-only and local-first: no raw transcripts, no matched words, no model names.\n\n${input.url}`
  }

  return `My ${window} Rage AI readout compares Claude and Codex at ${comparison}.\n\nThe score is aggregate-only and local-first: no raw transcripts, no matched words, no model names.\n\n${input.url}`
}

function createSingleHostDraft(input: ShareDraftInput, score: ShareScore): string {
  const window = formatWindow(input.window)
  const host = formatHostApp(score.hostApp)
  const rate = formatRate(score.ratePerThousandWords)
  const boundary = scoreBoundary(score)

  if (input.platform === 'x') {
    if (input.tone === 'snark') {
      return `${host} extracted ${rate} rage hits/1k words from my ${window} window. ${scoreBoundaryStart(score)} Rage AI score, transcripts stay local. ${input.url}`
    }
    return `${window} Rage AI score for ${host}: ${rate} rage hits/1k words. ${boundary}, transcripts stay local. ${input.url}`
  }

  if (input.tone === 'snark') {
    return `${host} delivered my ${window} Rage AI score: ${rate} rage hits per 1,000 words.\n\nThe share is ${boundary}. No raw transcripts, no matched words, no model names.\n\n${input.url}`
  }

  return `My ${window} Rage AI score for ${host} is ${rate} rage hits per 1,000 words.\n\n${shareBoundarySentence(score)} No raw transcripts, no matched words, no model names.\n\n${input.url}`
}

function fitXDraft(text: string, input: ShareDraftInput, scores: ShareScore[]): string {
  if (text.length <= 280) {
    return text
  }

  const conciseScores = comparisonLine(scores)
  const concise =
    scores.length > 1
      ? `Claude vs Codex rage check: ${conciseScores}. Transcripts stay local. ${input.url}`
      : `Rage AI score: ${conciseScores}. Transcripts stay local. ${input.url}`

  if (concise.length <= 280) {
    return concise
  }

  const shortest =
    scores.length > 1
      ? `Rage AI: ${conciseScores}. ${input.url}`
      : `Rage AI: ${formatScore(scores[0] as ShareScore)}. ${input.url}`

  return shortest.length <= 280 ? shortest : shortest.slice(0, 279).trimEnd()
}

export function createShareDraft(input: ShareDraftInput): ShareDraft {
  const scores = uniqueScores(input.scores)
  if (scores.length === 0) {
    throw new Error('At least one public score is required to create a share draft')
  }

  const text =
    scores.length > 1
      ? createComparisonDraft(input, scores.slice(0, 2))
      : createSingleHostDraft(input, scores[0] as ShareScore)
  const safeText = input.platform === 'x' ? fitXDraft(text, input, scores.slice(0, 2)) : text

  return {
    platform: input.platform,
    tone: input.tone,
    text: safeText,
    url: input.url,
    characterCount: safeText.length,
  }
}
