import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { HostApp, ScanSummary } from '@rageai/core'

export type StoredLocation = {
  hostApp: HostApp
  path: string
}

export type RageState = {
  installId: string
  apiUrl: string
  publishToken?: string
  pendingDeviceCode?: string
  handle?: string
  locations: StoredLocation[]
  lastSummary?: ScanSummary
}

const defaultState: RageState = {
  installId: randomUUID(),
  apiUrl: process.env.RAGE_API_URL ?? 'https://rageai.dev',
  locations: [],
}

export function stateDir(): string {
  return join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), 'rageai')
}

export function statePath(): string {
  return join(stateDir(), 'state.json')
}

export async function readState(): Promise<RageState> {
  try {
    const raw = await readFile(statePath(), 'utf8')
    const parsed = JSON.parse(raw) as Partial<RageState>
    return {
      ...defaultState,
      ...parsed,
      installId: parsed.installId ?? defaultState.installId,
      apiUrl: parsed.apiUrl ?? defaultState.apiUrl,
      locations: parsed.locations ?? [],
    }
  } catch {
    await writeState(defaultState)
    return defaultState
  }
}

export async function writeState(state: RageState): Promise<void> {
  await mkdir(stateDir(), { recursive: true })
  await writeFile(statePath(), `${JSON.stringify(state, null, 2)}\n`)
}

export async function updateState(update: (state: RageState) => RageState): Promise<RageState> {
  const next = update(await readState())
  await writeState(next)
  return next
}
