export const RULESET_VERSION = '2026.06.11-en-v1'
export const MINIMUM_DAILY_USER_WORDS = 100

export type HostApp = 'claude' | 'codex'
export type WindowKind = 'daily' | 'weekly' | 'all_time'
export type ProfanityIntensity = 'mild' | 'standard' | 'strong'
export type ParseConfidence = 'high' | 'best_effort'

export type TranscriptMessage = {
  hostApp: HostApp
  sessionId: string
  sourcePath: string
  role: 'user' | 'assistant' | 'tool' | 'unknown'
  text: string
  timestamp: string | null
  confidence: ParseConfidence
}

export type ProfanityMatch = {
  termId: string
  intensity: ProfanityIntensity
  count: number
}

export type RageWindow = {
  window: WindowKind
  windowStart: string | null
  windowEnd: string | null
  userMessageCount: number
  userWordCount: number
  scoredProfanityCount: number
  ratePerThousandWords: number
  topIntensity: ProfanityIntensity | null
  rankEligible: boolean
}

export type HostScanSummary = {
  hostApp: HostApp
  filesScanned: number
  filesSkipped: number
  localMessages: number
  publishableMessages: number
  windows: RageWindow[]
}

export type ScanSummary = {
  generatedAt: string
  hostApps: HostApp[]
  filesScanned: number
  filesSkipped: number
  localMessages: number
  publishableMessages: number
  hosts?: HostScanSummary[]
  windows: RageWindow[]
}
