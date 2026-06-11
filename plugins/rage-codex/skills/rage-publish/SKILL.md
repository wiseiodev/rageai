---
name: rage-publish
description: Preview and optionally publish aggregate Rage AI leaderboard stats. Use when the user asks to publish Rage AI stats.
---

Run the bundled Rage CLI with `publish` and the user's requested `--handle` value. By default it
previews both Claude and Codex payloads in one request. Use `--host claude` or `--host codex` only
when the user explicitly wants to debug one host.

First show the preview only. Add `--confirm` only after the user explicitly confirms the exact public payload and private anti-abuse metadata.

Prefer:

```bash
node "${PLUGIN_ROOT}/bin/rage.js" publish --handle <handle>
```

If `PLUGIN_ROOT` is unavailable in the shell, resolve `bin/rage.js` relative to this skill's
installed plugin root.
