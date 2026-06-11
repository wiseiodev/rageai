---
description: Preview and optionally publish aggregate Rage AI leaderboard stats
argument-hint: --handle <handle> [--confirm]
allowed-tools: Bash(node:*)
---

Preview the exact Claude and Codex public payloads and private anti-abuse metadata before anything is sent. Only include `--confirm` when the user explicitly confirms after reviewing the payload.

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/rage.js" publish $ARGUMENTS
```
