import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

export async function findTranscriptFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => [])
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(root, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await findTranscriptFiles(fullPath)))
    } else if (entry.isFile() && /\.(jsonl?|txt)$/iu.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}
