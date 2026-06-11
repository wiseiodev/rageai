import { chmod, copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const source = resolve(root, 'packages/rage-cli/dist/index.js')
const targets = [
  resolve(root, 'plugins/rage-claude/bin/rage.js'),
  resolve(root, 'plugins/rage-codex/bin/rage.js'),
]

for (const target of targets) {
  await mkdir(dirname(target), { recursive: true })
  await copyFile(source, target)
  await chmod(target, 0o755)
}

console.log(`Copied CLI bundle to ${targets.length} plugin folders`)
