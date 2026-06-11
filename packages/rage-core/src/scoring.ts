import { countProfanity, countWords, topIntensity } from './lexicon.js'
import {
  MINIMUM_DAILY_USER_WORDS,
  type RageWindow,
  type TranscriptMessage,
  type WindowKind,
} from './types.js'

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function windowBounds(kind: WindowKind, now: Date): { start: Date | null; end: Date | null } {
  if (kind === 'all_time') {
    return { start: null, end: null }
  }
  const dayStart = startOfUtcDay(now)
  if (kind === 'daily') {
    return { start: dayStart, end: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000) }
  }
  return {
    start: new Date(dayStart.getTime() - 6 * 24 * 60 * 60 * 1000),
    end: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000),
  }
}

function inWindow(message: TranscriptMessage, start: Date | null, end: Date | null): boolean {
  if (!start || !end) {
    return true
  }
  if (!message.timestamp) {
    return false
  }
  const time = new Date(message.timestamp).getTime()
  return Number.isFinite(time) && time >= start.getTime() && time < end.getTime()
}

export function aggregateWindow(
  messages: TranscriptMessage[],
  kind: WindowKind,
  now = new Date(),
): RageWindow {
  const { start, end } = windowBounds(kind, now)
  const included = messages.filter((message) => inWindow(message, start, end))
  const allMatches = included.flatMap((message) => countProfanity(message.text))
  const scoredProfanityCount = allMatches.reduce((sum, match) => sum + match.count, 0)
  const userWordCount = included.reduce((sum, message) => sum + countWords(message.text), 0)
  const ratePerThousandWords =
    userWordCount > 0 ? Number(((scoredProfanityCount / userWordCount) * 1000).toFixed(2)) : 0

  return {
    window: kind,
    windowStart: start?.toISOString() ?? null,
    windowEnd: end?.toISOString() ?? null,
    userMessageCount: included.length,
    userWordCount,
    scoredProfanityCount,
    ratePerThousandWords,
    topIntensity: topIntensity(allMatches),
    rankEligible: userWordCount >= MINIMUM_DAILY_USER_WORDS && scoredProfanityCount > 0,
  }
}

export function aggregatePublishableWindows(
  messages: TranscriptMessage[],
  now = new Date(),
): RageWindow[] {
  const publishable = messages.filter(
    (message) =>
      message.role === 'user' && message.confidence === 'high' && message.timestamp !== null,
  )

  return [
    aggregateWindow(publishable, 'daily', now),
    aggregateWindow(publishable, 'weekly', now),
    aggregateWindow(publishable, 'all_time', now),
  ]
}
