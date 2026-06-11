import { describe, expect, it } from 'vitest'
import { createShareDraft, type ShareScore } from '../share.js'

const shareUrl = 'https://rageai.dev/share/score_123'

const scores: ShareScore[] = [
  {
    hostApp: 'claude',
    ratePerThousandWords: '4.20',
    userWordCount: 1400,
    scoredProfanityCount: 6,
    topIntensity: 'standard',
    rankEligible: true,
  },
  {
    hostApp: 'codex',
    ratePerThousandWords: '11.54',
    userWordCount: 520,
    scoredProfanityCount: 6,
    topIntensity: 'strong',
    rankEligible: true,
  },
]

describe('share drafts', () => {
  it('creates a short X comparison draft', () => {
    const draft = createShareDraft({
      handle: 'wise',
      platform: 'x',
      tone: 'professional',
      window: 'daily',
      url: shareUrl,
      scores,
    })

    expect(draft.characterCount).toBeLessThanOrEqual(280)
    expect(draft.text).toContain('Claude')
    expect(draft.text).toContain('Codex')
    expect(draft.text).toContain(shareUrl)
  })

  it('creates a longer LinkedIn comparison draft with privacy framing', () => {
    const draft = createShareDraft({
      handle: 'wise',
      platform: 'linkedin',
      tone: 'professional',
      window: 'weekly',
      url: shareUrl,
      scores,
    })

    expect(draft.text).toContain('weekly Rage AI readout')
    expect(draft.text).toContain('no raw transcripts')
    expect(draft.text).toContain('no matched words')
    expect(draft.text).toContain('no model names')
  })

  it('supports a snark tone without changing the public-data boundary', () => {
    const draft = createShareDraft({
      handle: 'wise',
      platform: 'x',
      tone: 'snark',
      window: 'daily',
      url: shareUrl,
      scores,
    })

    expect(draft.text).toContain('derby')
    expect(draft.text).toContain('Aggregate-only')
    expect(draft.text).toContain('transcripts stay local')
  })

  it('falls back to one-host copy when only one score is public', () => {
    const draft = createShareDraft({
      handle: 'wise',
      platform: 'linkedin',
      tone: 'professional',
      window: 'all_time',
      url: shareUrl,
      scores: [scores[0] as ShareScore],
    })

    expect(draft.text).toContain('Claude')
    expect(draft.text).not.toContain('Codex')
    expect(draft.text).toContain('aggregate-only')
  })

  it('does not include private or sensitive field names', () => {
    const draft = createShareDraft({
      handle: 'wise',
      platform: 'linkedin',
      tone: 'snark',
      window: 'daily',
      url: shareUrl,
      scores,
    })

    expect(draft.text).not.toMatch(/sourcePath|installId|raw IP|GitHub|gpt-4|sonnet/i)
    expect(draft.text).not.toContain('matched words:')
  })
})
