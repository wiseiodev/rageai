import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import type { HostApp, ParseConfidence, TranscriptMessage } from './types.js'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stableSessionId(sourcePath: string): string {
  return createHash('sha256').update(sourcePath).digest('hex').slice(0, 16)
}

function readString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }
  return null
}

function extractText(record: UnknownRecord): string | null {
  const direct = readString(record.text) ?? readString(record.content) ?? readString(record.message)
  if (direct) {
    return direct
  }

  if (Array.isArray(record.content)) {
    const parts = record.content
      .map((part) => (isRecord(part) ? readString(part.text) : readString(part)))
      .filter((part): part is string => Boolean(part))
    return parts.length > 0 ? parts.join('\n') : null
  }

  if (isRecord(record.message)) {
    return extractText(record.message)
  }

  return null
}

function extractRole(record: UnknownRecord): TranscriptMessage['role'] {
  const role =
    readString(record.role) ??
    readString(record.type) ??
    (isRecord(record.message) ? readString(record.message.role) : null)

  if (role === 'user' || role === 'human' || role === 'UserPromptSubmit') {
    return 'user'
  }
  if (role === 'assistant') {
    return 'assistant'
  }
  if (role === 'tool' || role === 'tool_result' || role === 'function') {
    return 'tool'
  }
  return 'unknown'
}

function extractTimestamp(record: UnknownRecord): string | null {
  const raw =
    readString(record.timestamp) ??
    readString(record.created_at) ??
    readString(record.createdAt) ??
    readString(record.time)

  if (!raw) {
    return null
  }
  const date = new Date(raw)
  return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

function normalizeTranscriptRecord(record: UnknownRecord): UnknownRecord {
  if (record.type === 'response_item' && isRecord(record.payload)) {
    return {
      ...record.payload,
      timestamp: record.payload.timestamp ?? record.timestamp,
    }
  }

  return record
}

function parseJsonRecords(raw: string): unknown[] {
  const trimmed = raw.trim()
  if (!trimmed) {
    return []
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (Array.isArray(parsed)) {
      return parsed
    }
    if (isRecord(parsed) && Array.isArray(parsed.messages)) {
      return parsed.messages
    }
    return [parsed]
  } catch {
    return trimmed
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as unknown]
        } catch {
          return []
        }
      })
  }
}

function confidenceFor(record: UnknownRecord, role: TranscriptMessage['role']): ParseConfidence {
  if (
    role === 'user' &&
    (record.role || record.type || (isRecord(record.message) && record.message.role))
  ) {
    return 'high'
  }
  return 'best_effort'
}

export async function parseTranscriptFile(
  sourcePath: string,
  hostApp: HostApp,
): Promise<TranscriptMessage[]> {
  const raw = await readFile(sourcePath, 'utf8')
  const records = parseJsonRecords(raw)
  const sessionId = stableSessionId(sourcePath)

  return records.flatMap((record) => {
    if (!isRecord(record)) {
      return []
    }
    const normalizedRecord = normalizeTranscriptRecord(record)
    const text = extractText(normalizedRecord)
    if (!text) {
      return []
    }
    const role = extractRole(normalizedRecord)
    return [
      {
        hostApp,
        sessionId,
        sourcePath,
        role,
        text,
        timestamp: extractTimestamp(normalizedRecord),
        confidence: confidenceFor(normalizedRecord, role),
      },
    ]
  })
}

export function inferHostApp(sourcePath: string): HostApp | null {
  const lower = sourcePath.toLocaleLowerCase()
  if (lower.includes('claude')) {
    return 'claude'
  }
  if (lower.includes('codex') || basename(lower).endsWith('.jsonl')) {
    return 'codex'
  }
  return null
}
