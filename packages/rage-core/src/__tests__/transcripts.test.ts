import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { aggregatePublishableWindows } from '../scoring.js'
import { parseTranscriptFile } from '../transcripts.js'

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../__fixtures__')

describe('transcript parsing', () => {
  it('extracts only high-confidence user messages for publishable windows', async () => {
    const messages = await parseTranscriptFile(join(fixturesDir, 'codex-session.jsonl'), 'codex')
    const windows = aggregatePublishableWindows(messages, new Date('2026-06-11T18:00:00.000Z'))

    expect(messages).toHaveLength(3)
    expect(messages.filter((message) => message.role === 'user')).toHaveLength(1)
    expect(windows.find((window) => window.window === 'daily')?.scoredProfanityCount).toBe(2)
  })

  it('parses Claude-style JSON arrays', async () => {
    const messages = await parseTranscriptFile(join(fixturesDir, 'claude-session.json'), 'claude')

    expect(messages[0]?.role).toBe('user')
    expect(messages[0]?.confidence).toBe('high')
  })

  it('parses Codex response_item payload records', async () => {
    const messages = await parseTranscriptFile(
      join(fixturesDir, 'codex-response-item.jsonl'),
      'codex',
    )
    const windows = aggregatePublishableWindows(messages, new Date('2026-06-11T18:00:00.000Z'))

    expect(messages.map((message) => message.role)).toEqual(['user', 'assistant'])
    expect(messages[0]?.timestamp).toBe('2026-06-11T13:00:00.000Z')
    expect(windows.find((window) => window.window === 'daily')?.scoredProfanityCount).toBe(1)
  })
})
