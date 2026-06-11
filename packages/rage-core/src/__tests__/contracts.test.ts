import { describe, expect, it } from 'vitest'
import {
  publishBatchRequestSchema,
  publishRequestSchema,
  publishResponseSchema,
} from '../contracts.js'
import { RULESET_VERSION } from '../types.js'

describe('publish contract', () => {
  const dailyWindow = {
    window: 'daily' as const,
    windowStart: '2026-06-11T00:00:00.000Z',
    windowEnd: '2026-06-12T00:00:00.000Z',
    userMessageCount: 10,
    userWordCount: 220,
    scoredProfanityCount: 4,
    ratePerThousandWords: 18.18,
    topIntensity: 'strong' as const,
    rankEligible: true,
  }

  it('accepts sanitized aggregate-only payloads', () => {
    const parsed = publishRequestSchema.parse({
      publicPayload: {
        handle: 'wise',
        hostApp: 'codex',
        pluginVersion: '0.1.0',
        rulesetVersion: RULESET_VERSION,
        generatedAt: '2026-06-11T12:00:00.000Z',
        windows: [dailyWindow],
      },
      privateAntiAbuse: {
        installId: '018f8f13-7d2f-7abc-8df6-cadfe7fdb000',
      },
    })

    expect(parsed.publicPayload.windows[0]?.topIntensity).toBe('strong')
  })

  it('accepts a batch of Claude and Codex payloads for one publish action', () => {
    const parsed = publishBatchRequestSchema.parse({
      publicPayloads: ['claude', 'codex'].map((hostApp) => ({
        handle: 'wise',
        hostApp,
        pluginVersion: '0.1.0',
        rulesetVersion: RULESET_VERSION,
        generatedAt: '2026-06-11T12:00:00.000Z',
        windows: [dailyWindow],
      })),
      privateAntiAbuse: {
        installId: '018f8f13-7d2f-7abc-8df6-cadfe7fdb000',
      },
    })

    expect(parsed.publicPayloads.map((payload) => payload.hostApp)).toEqual(['claude', 'codex'])
  })

  it('accepts optional public share URLs in publish responses', () => {
    const parsed = publishResponseSchema.parse({
      ok: true,
      message: 'Rage scores published.',
      leaderboardUrl: 'https://rageai.dev/leaderboard',
      published: ['claude', 'codex'],
      shareUrls: [
        {
          window: 'daily',
          url: 'https://rageai.dev/share/score_123',
        },
      ],
    })

    expect(parsed.shareUrls?.[0]?.window).toBe('daily')
  })
})
