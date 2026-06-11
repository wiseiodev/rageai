import { spawn } from 'node:child_process'
import { platform } from 'node:os'
import { setTimeout as sleep } from 'node:timers/promises'
import {
  aggregatePublishableWindows,
  createShareDraft,
  discoverTranscriptLocations,
  type HostApp,
  type HostScanSummary,
  type PublicPublishPayload,
  parseTranscriptFile,
  publishBatchRequestSchema,
  publishRequestSchema,
  RULESET_VERSION,
  type ScanSummary,
  type SharePlatform,
  type ShareScore,
  type ShareTone,
  type TranscriptMessage,
  type WindowKind,
} from '@rageai/core'
import { postJson, publishPayload } from './api.js'
import { findTranscriptFiles } from './files.js'
import { readState, statePath, updateState } from './state.js'

const PLUGIN_VERSION = '0.1.0'
const SCAN_MOOD_WORDS = [
  'fudge',
  'heck',
  'dang',
  'frick',
  'shoot',
  'crud',
  'blast',
  'gosh darn',
  'son of a biscuit',
  'cheese and crackers',
  'mother of pearl',
  'what the forklift',
  'sassafras',
  'baloney',
  'malarkey',
  'shazbot',
  'flim-flam',
  'heckfire',
]
const SCAN_FRAMES = ['-', '\\', '|', '/']

type Args = {
  command: string[]
  flags: Map<string, string | boolean>
}

type DeviceCompleteResponse = {
  token?: string
  handle?: string
  ok?: boolean
  message?: string
  status?: string
}

type ScanProgressState = {
  totalFiles: number
  currentHost: HostApp | null
  filesScanned: number
  filesSkipped: number
  localMessages: number
  publishableMessages: number
}

function parseArgs(argv: string[]): Args {
  const command: string[] = []
  const flags = new Map<string, string | boolean>()

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg) {
      continue
    }
    if (!arg.startsWith('--')) {
      command.push(arg)
      continue
    }
    const key = arg.slice(2)
    const next = argv[index + 1]
    if (next && !next.startsWith('--')) {
      flags.set(key, next)
      index += 1
    } else {
      flags.set(key, true)
    }
  }

  return { command, flags }
}

function flagString(flags: Map<string, string | boolean>, key: string): string | null {
  const value = flags.get(key)
  return typeof value === 'string' ? value : null
}

function flagWindow(flags: Map<string, string | boolean>): WindowKind {
  const window = flagString(flags, 'window')
  if (window === 'weekly' || window === 'all_time' || window === 'daily') {
    return window
  }
  return 'daily'
}

function flagPlatform(flags: Map<string, string | boolean>): SharePlatform {
  return flagString(flags, 'platform') === 'linkedin' ? 'linkedin' : 'x'
}

function flagTone(flags: Map<string, string | boolean>): ShareTone {
  return flagString(flags, 'tone') === 'snark' ? 'snark' : 'professional'
}

function openBrowserUrl(url: string): boolean {
  const currentPlatform = platform()
  const command =
    currentPlatform === 'darwin' ? 'open' : currentPlatform === 'win32' ? 'cmd' : 'xdg-open'
  const args = currentPlatform === 'win32' ? ['/c', 'start', '', url] : [url]

  try {
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
    })
    child.unref()
    return true
  } catch {
    return false
  }
}

async function completeDeviceAuth(
  apiUrl: string,
  installId: string,
  deviceCode: string,
): Promise<DeviceCompleteResponse> {
  const response = await fetch(`${apiUrl}/api/auth/device/complete`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ deviceCode, installId }),
  })
  const data = (await response.json().catch(() => ({}))) as DeviceCompleteResponse

  if (response.status === 202) {
    return data
  }
  if (!response.ok) {
    throw new Error(data.message ?? `Device auth failed with ${response.status}`)
  }
  if (!data.token) {
    throw new Error('Device auth completed without a publish token')
  }

  return data
}

async function storeAuthToken(response: DeviceCompleteResponse): Promise<void> {
  if (!response.token) {
    throw new Error('Device auth completed without a publish token')
  }
  const token = response.token

  await updateState((current) => {
    const { pendingDeviceCode: _pendingDeviceCode, ...rest } = current
    const next = {
      ...rest,
      publishToken: token,
    }
    if (response.handle) {
      return { ...next, handle: response.handle }
    }
    return next
  })
  console.log('Publish token stored locally.')
}

function formatHostApp(hostApp: HostApp): string {
  return hostApp === 'claude' ? 'Claude' : 'Codex'
}

function formatWindowTable(windows: ScanSummary['windows']): string[] {
  const lines = ['Window        Rage/1k words   Rage   Words   Rankable   Top']

  for (const window of windows) {
    lines.push(
      `${window.window.padEnd(13)} ${String(window.ratePerThousandWords).padStart(12)}   ${String(
        window.scoredProfanityCount,
      ).padStart(6)}   ${String(window.userWordCount).padStart(5)}   ${
        window.rankEligible ? 'yes' : 'no '
      }       ${window.topIntensity ?? '-'}`,
    )
  }

  return lines
}

function formatHostSummary(hostSummary: HostScanSummary): string[] {
  return [
    `${formatHostApp(hostSummary.hostApp)}`,
    `Files: ${hostSummary.filesScanned} scanned, ${hostSummary.filesSkipped} skipped`,
    `Messages: ${hostSummary.localMessages} local, ${hostSummary.publishableMessages} publishable`,
    ...formatWindowTable(hostSummary.windows),
  ]
}

function formatSummary(summary: ScanSummary): string {
  const lines = [
    `Generated: ${summary.generatedAt}`,
    `Hosts: ${summary.hostApps.map(formatHostApp).join(', ') || 'none'}`,
    `Files: ${summary.filesScanned} scanned, ${summary.filesSkipped} skipped`,
    `Messages: ${summary.localMessages} local, ${summary.publishableMessages} publishable`,
  ]

  if (summary.hosts && summary.hosts.length > 0) {
    for (const hostSummary of summary.hosts) {
      lines.push('', ...formatHostSummary(hostSummary))
    }
    if (summary.hosts.length > 1) {
      lines.push('', 'All hosts', ...formatWindowTable(summary.windows))
    }
  } else {
    lines.push(
      '',
      'Legacy combined stats. Run `rage scan --confirm` again to generate per-host stats.',
      ...formatWindowTable(summary.windows),
    )
  }

  return lines.join('\n')
}

function createScanProgress(totalFiles: number) {
  const startedAt = Date.now()
  const interactive = process.stderr.isTTY && !process.env.CI
  const state: ScanProgressState = {
    totalFiles,
    currentHost: null,
    filesScanned: 0,
    filesSkipped: 0,
    localMessages: 0,
    publishableMessages: 0,
  }
  let tick = 0
  let lastLength = 0
  let timer: ReturnType<typeof setInterval> | null = null

  function line(): string {
    const word = SCAN_MOOD_WORDS[tick % SCAN_MOOD_WORDS.length]
    const frame = SCAN_FRAMES[tick % SCAN_FRAMES.length]
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
    const host = state.currentHost ? `${state.currentHost} ` : ''

    return `${frame} ${word}... scanning ${host}${state.filesScanned + state.filesSkipped}/${
      state.totalFiles
    } files, ${state.localMessages} messages (${state.publishableMessages} publishable), ${elapsedSeconds}s`
  }

  function render() {
    const output = line()
    if (interactive) {
      const padding = lastLength > output.length ? ' '.repeat(lastLength - output.length) : ''
      process.stderr.write(`\r${output}${padding}`)
      lastLength = output.length
      return
    }
    console.error(output)
  }

  return {
    start() {
      if (totalFiles === 0) {
        return
      }
      render()
      timer = setInterval(() => {
        tick += 1
        render()
      }, 2000)
    },
    update(update: Partial<Omit<ScanProgressState, 'totalFiles'>>) {
      Object.assign(state, update)
    },
    stop() {
      if (timer) {
        clearInterval(timer)
      }
      if (interactive && lastLength > 0) {
        process.stderr.write(`\r${' '.repeat(lastLength)}\r`)
      }
    },
  }
}

async function scan(flags: Map<string, string | boolean>): Promise<void> {
  const state = await readState()
  const confirm = flags.has('confirm')
  const locations =
    state.locations.length > 0
      ? state.locations
      : (await discoverTranscriptLocations()).map(({ hostApp, path }) => ({ hostApp, path }))

  if (locations.length === 0) {
    console.log('No Claude or Codex transcript locations were discovered.')
    return
  }

  if (!confirm && state.locations.length === 0) {
    const preview = await discoverTranscriptLocations()
    console.log('Rage AI found these local transcript locations:')
    for (const location of preview) {
      console.log(`- ${location.hostApp}: ${location.path} (${location.fileCount} likely files)`)
    }
    console.log('\nNothing was scanned yet. Rerun with `rage scan --confirm` to scan these paths.')
    return
  }

  const messages: TranscriptMessage[] = []
  let filesScanned = 0
  let filesSkipped = 0
  let publishableMessages = 0
  const scanTargets: Array<{ file: string; hostApp: HostApp }> = []
  const hostApps = [...new Set(locations.map((location) => location.hostApp))]
  const hostStats = new Map<
    HostApp,
    {
      filesScanned: number
      filesSkipped: number
      messages: TranscriptMessage[]
      publishableMessages: number
    }
  >(
    hostApps.map((hostApp) => [
      hostApp,
      {
        filesScanned: 0,
        filesSkipped: 0,
        messages: [],
        publishableMessages: 0,
      },
    ]),
  )

  for (const location of locations) {
    const files = await findTranscriptFiles(location.path)
    for (const file of files) {
      scanTargets.push({ file, hostApp: location.hostApp })
    }
  }

  const progress = createScanProgress(scanTargets.length)
  progress.start()

  try {
    for (const { file, hostApp } of scanTargets) {
      const host = hostStats.get(hostApp)
      if (!host) {
        continue
      }
      try {
        const parsedMessages = await parseTranscriptFile(file, hostApp)
        const parsedPublishableMessages = parsedMessages.filter(
          (message) =>
            message.role === 'user' && message.confidence === 'high' && message.timestamp !== null,
        ).length
        messages.push(...parsedMessages)
        host.messages.push(...parsedMessages)
        filesScanned += 1
        host.filesScanned += 1
        publishableMessages += parsedPublishableMessages
        host.publishableMessages += parsedPublishableMessages
      } catch {
        filesSkipped += 1
        host.filesSkipped += 1
      }
      progress.update({
        currentHost: hostApp,
        filesScanned,
        filesSkipped,
        localMessages: messages.length,
        publishableMessages,
      })
    }
  } finally {
    progress.stop()
  }

  const hosts: HostScanSummary[] = hostApps.map((hostApp) => {
    const host = hostStats.get(hostApp)
    return {
      hostApp,
      filesScanned: host?.filesScanned ?? 0,
      filesSkipped: host?.filesSkipped ?? 0,
      localMessages: host?.messages.length ?? 0,
      publishableMessages: host?.publishableMessages ?? 0,
      windows: aggregatePublishableWindows(host?.messages ?? []),
    }
  })

  const summary: ScanSummary = {
    generatedAt: new Date().toISOString(),
    hostApps,
    filesScanned,
    filesSkipped,
    localMessages: messages.length,
    publishableMessages,
    hosts,
    windows: aggregatePublishableWindows(messages),
  }

  await updateState((current) => ({
    ...current,
    locations,
    lastSummary: summary,
  }))

  console.log(formatSummary(summary))
}

async function stats(): Promise<void> {
  const state = await readState()
  if (!state.lastSummary) {
    console.log('No local stats yet. Run `rage scan --confirm` first.')
    return
  }
  console.log(formatSummary(state.lastSummary))
  console.log(`\nLocal state: ${statePath()}`)
}

function buildPublicPayload(
  handle: string,
  hostApp: HostApp,
  windows: ScanSummary['windows'],
): PublicPublishPayload {
  return {
    handle,
    hostApp,
    pluginVersion: PLUGIN_VERSION,
    rulesetVersion: RULESET_VERSION,
    generatedAt: new Date().toISOString(),
    windows,
  }
}

async function publish(flags: Map<string, string | boolean>): Promise<void> {
  const state = await readState()
  const handle = flagString(flags, 'handle') ?? state.handle
  const host = flagString(flags, 'host') as HostApp | null

  if (!state.lastSummary) {
    console.log('No local stats yet. Run `rage scan --confirm` first.')
    return
  }
  if (!handle) {
    console.log('Choose a public handle with `rage publish --handle your_handle`.')
    return
  }
  if (host && !['claude', 'codex'].includes(host)) {
    console.log('Choose a host with `rage publish --host claude` or `rage publish --host codex`.')
    return
  }

  const hostSummaries = host
    ? (state.lastSummary.hosts?.filter((candidate) => candidate.hostApp === host) ?? [])
    : (state.lastSummary.hosts ?? [])

  if (hostSummaries.length === 0) {
    console.log(
      host
        ? `No separate ${host} stats found. Run \`rage scan --confirm\` again to generate per-host stats.`
        : 'No separate host stats found. Run `rage scan --confirm` again to generate per-host stats.',
    )
    return
  }

  const payloads = hostSummaries.map((hostSummary) =>
    publishRequestSchema.parse({
      publicPayload: buildPublicPayload(handle, hostSummary.hostApp, hostSummary.windows),
      privateAntiAbuse: {
        installId: state.installId,
      },
    }),
  )
  const batchPayload = publishBatchRequestSchema.parse({
    publicPayloads: payloads.map((payload) => payload.publicPayload),
    privateAntiAbuse: {
      installId: state.installId,
    },
  })

  console.log('Rage AI will publish these public payloads:')
  console.log(JSON.stringify(batchPayload.publicPayloads, null, 2))
  console.log('\nPrivate anti-abuse metadata sent but never displayed:')
  console.log(JSON.stringify(batchPayload.privateAntiAbuse, null, 2))

  if (!flags.has('confirm')) {
    console.log('\nNothing was sent. Rerun with `--confirm` after reviewing the payload.')
    return
  }

  if (!state.publishToken) {
    console.log('No publish token found. Run `rage auth login` first.')
    return
  }

  const response = await publishPayload(state.apiUrl, state.publishToken, batchPayload)
  console.log(response.message)
  if (response.published && response.published.length > 0) {
    console.log(`Published hosts: ${response.published.join(', ')}`)
  }
  if (response.leaderboardUrl) {
    console.log(response.leaderboardUrl)
  }
  if (response.shareUrls && response.shareUrls.length > 0) {
    console.log('Share drafts:')
    for (const shareUrl of response.shareUrls) {
      console.log(`rage share --window ${shareUrl.window} --platform x`)
      console.log(shareUrl.url)
    }
  }
  await updateState((current) => {
    const next = { ...current, handle }
    if (response.shareUrls) {
      return { ...next, shareUrls: response.shareUrls }
    }
    return next
  })
}

function scoresForShare(summary: ScanSummary, window: WindowKind): ShareScore[] {
  return (summary.hosts ?? []).flatMap((hostSummary) => {
    const score = hostSummary.windows.find((candidate) => candidate.window === window)
    if (!score) {
      return []
    }
    return [
      {
        hostApp: hostSummary.hostApp,
        ratePerThousandWords: score.ratePerThousandWords,
        userWordCount: score.userWordCount,
        scoredProfanityCount: score.scoredProfanityCount,
        topIntensity: score.topIntensity,
        rankEligible: score.rankEligible,
      },
    ]
  })
}

async function share(flags: Map<string, string | boolean>): Promise<void> {
  const state = await readState()
  const window = flagWindow(flags)
  const platform = flagPlatform(flags)
  const tone = flagTone(flags)

  if (!state.lastSummary) {
    console.log('No local stats yet. Run `rage scan --confirm` first.')
    return
  }
  if (!state.handle) {
    console.log('No public handle yet. Run `rage publish --handle your_handle --confirm` first.')
    return
  }

  const scores = scoresForShare(state.lastSummary, window)
  if (scores.length === 0) {
    console.log(`No ${window} host scores found. Run \`rage scan --confirm\` first.`)
    return
  }

  const url = state.shareUrls?.find((shareUrl) => shareUrl.window === window)?.url
  if (!url) {
    console.log('No score-specific share URL found yet. Using the public leaderboard URL.')
  }

  const draft = createShareDraft({
    handle: state.handle,
    platform,
    tone,
    window,
    url: url ?? `${state.apiUrl}/leaderboard`,
    scores,
  })

  console.log(`${platform === 'x' ? 'X' : 'LinkedIn'} ${tone} draft:`)
  console.log(draft.text)
  console.log(`\nCharacters: ${draft.characterCount}`)
}

async function leaderboard(): Promise<void> {
  const state = await readState()
  const response = await fetch(`${state.apiUrl}/api/leaderboard`)
  if (!response.ok) {
    throw new Error(`Leaderboard request failed with ${response.status}`)
  }
  const data = (await response.json()) as {
    rows?: Array<{ handle: string; ratePerThousandWords: string; hostApp: string }>
  }
  const rows = data.rows ?? []
  if (rows.length === 0) {
    console.log('No leaderboard rows yet.')
    return
  }
  for (const [index, row] of rows.entries()) {
    console.log(
      `${index + 1}. ${row.handle} (${row.hostApp}) - ${row.ratePerThousandWords} rage/1k words`,
    )
  }
}

async function authLogin(flags: Map<string, string | boolean>): Promise<void> {
  const state = await readState()
  const deviceLabel = flagString(flags, 'label') ?? 'Rage CLI'
  const response = await postJson<{
    userCode: string
    verificationUri: string
    deviceCode: string
    expiresAt: string
  }>(`${state.apiUrl}/api/auth/device/start`, {
    installId: state.installId,
    deviceLabel,
  })

  await updateState((current) => ({ ...current, pendingDeviceCode: response.deviceCode }))
  if (openBrowserUrl(response.verificationUri)) {
    console.log(`Opened ${response.verificationUri}`)
  } else {
    console.log(`Open ${response.verificationUri}`)
  }
  console.log(`Device code: ${response.userCode}`)
  console.log('Waiting for browser approval...')

  const expiresAt = new Date(response.expiresAt).getTime()
  while (Date.now() < expiresAt) {
    try {
      const completed = await completeDeviceAuth(state.apiUrl, state.installId, response.deviceCode)
      if (completed.token) {
        await storeAuthToken(completed)
        return
      }
    } catch {
      // Transient errors (network blips, or a 404 once the request expires server-side)
      // should not abort login; keep polling until the local expiry elapses.
    }
    await sleep(2000)
  }

  console.log('Device approval timed out. Run `rage auth login` again to restart.')
}

async function authComplete(flags: Map<string, string | boolean>): Promise<void> {
  const state = await readState()
  const deviceCode = flagString(flags, 'device-code') ?? state.pendingDeviceCode
  if (!deviceCode) {
    console.log('No pending device code. Run `rage auth login` first.')
    return
  }

  const response = await completeDeviceAuth(state.apiUrl, state.installId, deviceCode)
  if (!response.token) {
    console.log(response.message ?? 'Device is still waiting for browser approval.')
    return
  }
  await storeAuthToken(response)
}

async function authLogout(): Promise<void> {
  await updateState((current) => {
    const { publishToken: _publishToken, ...rest } = current
    return rest
  })
  console.log('Local publish token removed.')
}

function help(): void {
  console.log(`Rage AI ${PLUGIN_VERSION}

Commands:
  rage scan [--confirm]
  rage stats
  rage publish --handle name [--host claude|codex] [--confirm]
  rage share [--platform x|linkedin] [--tone professional|snark] [--window daily|weekly|all_time]
  rage leaderboard
  rage auth login [--label "Claude on my Mac"]
  rage auth complete --device-code code
  rage auth logout
  rage --version`)
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const [command, subcommand] = args.command

  if (args.flags.has('version') || command === '--version') {
    console.log(PLUGIN_VERSION)
    return
  }

  if (command === 'scan') {
    await scan(args.flags)
    return
  }
  if (command === 'stats') {
    await stats()
    return
  }
  if (command === 'publish') {
    await publish(args.flags)
    return
  }
  if (command === 'share') {
    await share(args.flags)
    return
  }
  if (command === 'leaderboard') {
    await leaderboard()
    return
  }
  if (command === 'auth' && subcommand === 'login') {
    await authLogin(args.flags)
    return
  }
  if (command === 'auth' && subcommand === 'complete') {
    await authComplete(args.flags)
    return
  }
  if (command === 'auth' && subcommand === 'logout') {
    await authLogout()
    return
  }

  help()
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
