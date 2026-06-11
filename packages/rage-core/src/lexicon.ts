import type { ProfanityIntensity, ProfanityMatch } from './types.js'

type LexiconEntry = {
  id: string
  intensity: ProfanityIntensity
  patterns: RegExp[]
}

const fuzzyBoundary = '[^a-z0-9]*'

export const profanityLexicon: LexiconEntry[] = [
  {
    id: 'damn',
    intensity: 'mild',
    patterns: [/\bdamn(?:ed|ing)?\b/giu],
  },
  {
    id: 'hell',
    intensity: 'mild',
    patterns: [/\bhell\b/giu],
  },
  {
    id: 'crap',
    intensity: 'mild',
    patterns: [/\bcrap+\b/giu],
  },
  {
    id: 'ass',
    intensity: 'standard',
    patterns: [/\bass(?:hole|hat)?s?\b/giu],
  },
  {
    id: 'shit',
    intensity: 'standard',
    patterns: [
      /\bshit+(?:ty|ting|head|show|storm|s)?\b/giu,
      new RegExp(`\\bs+${fuzzyBoundary}h+${fuzzyBoundary}i+${fuzzyBoundary}t+\\b`, 'giu'),
    ],
  },
  {
    id: 'bullshit',
    intensity: 'standard',
    patterns: [/\bbullshit+\b/giu],
  },
  {
    id: 'bitch',
    intensity: 'standard',
    patterns: [/\bbitch(?:ing|ed|es|y)?\b/giu],
  },
  {
    id: 'wtf',
    intensity: 'strong',
    patterns: [/\bwtf+\b/giu],
  },
  {
    id: 'fuck',
    intensity: 'strong',
    patterns: [
      /\bfuck+(?:ed|er|ers|ing|s|up)?\b/giu,
      new RegExp(`\\bf+${fuzzyBoundary}u+${fuzzyBoundary}c+${fuzzyBoundary}k+\\b`, 'giu'),
    ],
  },
  {
    id: 'motherfucker',
    intensity: 'strong',
    patterns: [/\bmotherfuck(?:er|ers|ing)?\b/giu],
  },
  {
    id: 'fml',
    intensity: 'strong',
    patterns: [/\bfml+\b/giu],
  },
]

const allowlist = new Set(['assembly', 'assign', 'classic', 'class', 'scunthorpe'])

export function countWords(text: string): number {
  return text.match(/\b[\p{L}\p{N}][\p{L}\p{N}'-]*\b/gu)?.length ?? 0
}

export function countProfanity(text: string): ProfanityMatch[] {
  const lowered = text.toLocaleLowerCase()
  const matches = new Map<string, ProfanityMatch>()

  for (const entry of profanityLexicon) {
    let count = 0
    for (const pattern of entry.patterns) {
      pattern.lastIndex = 0
      for (const match of lowered.matchAll(pattern)) {
        const matchedText = match[0]?.replace(/[^a-z0-9]/giu, '') ?? ''
        if (!matchedText || allowlist.has(matchedText)) {
          continue
        }
        count += 1
      }
    }

    if (count > 0) {
      matches.set(entry.id, {
        termId: entry.id,
        intensity: entry.intensity,
        count,
      })
    }
  }

  return [...matches.values()]
}

export function topIntensity(matches: ProfanityMatch[]): ProfanityIntensity | null {
  const counts: Record<ProfanityIntensity, number> = {
    mild: 0,
    standard: 0,
    strong: 0,
  }

  for (const match of matches) {
    counts[match.intensity] += match.count
  }

  if (counts.strong > 0) {
    return 'strong'
  }
  if (counts.standard > 0) {
    return 'standard'
  }
  if (counts.mild > 0) {
    return 'mild'
  }
  return null
}
