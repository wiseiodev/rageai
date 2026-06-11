import { existsSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { HostApp } from './types.js'

export type DiscoveredTranscriptLocation = {
  hostApp: HostApp
  path: string
  fileCount: number
}

const candidateRoots: Array<{ hostApp: HostApp; paths: string[] }> = [
  {
    hostApp: 'claude',
    paths: ['.claude/projects', 'Library/Application Support/Claude Code', '.config/claude'],
  },
  {
    hostApp: 'codex',
    paths: ['.codex/sessions', 'Library/Application Support/Codex', '.config/codex'],
  },
]

async function countTranscriptFiles(root: string): Promise<number> {
  let count = 0
  const entries = await readdir(root, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    const fullPath = join(root, entry.name)
    if (entry.isDirectory()) {
      count += await countTranscriptFiles(fullPath)
    } else if (entry.isFile() && /\.(jsonl?|txt)$/iu.test(entry.name)) {
      count += 1
    }
  }
  return count
}

export async function discoverTranscriptLocations(
  homeDirectory = homedir(),
): Promise<DiscoveredTranscriptLocation[]> {
  const discovered: DiscoveredTranscriptLocation[] = []

  for (const candidate of candidateRoots) {
    for (const relativePath of candidate.paths) {
      const path = join(homeDirectory, relativePath)
      if (!existsSync(path)) {
        continue
      }
      const details = await stat(path).catch(() => null)
      if (!details?.isDirectory()) {
        continue
      }
      discovered.push({
        hostApp: candidate.hostApp,
        path,
        fileCount: await countTranscriptFiles(path),
      })
    }
  }

  return discovered
}
