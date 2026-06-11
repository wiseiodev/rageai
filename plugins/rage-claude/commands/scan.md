---
description: Scan local Claude and Codex transcripts for private Rage AI stats
argument-hint: [--preview]
allowed-tools: Bash(node:*)
---

Run the bundled Rage AI scanner. By default this previews discovered paths and scans nothing. Pass
`--confirm` only when the user explicitly wants to scan those paths.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/rage.js" scan $ARGUMENTS
```
