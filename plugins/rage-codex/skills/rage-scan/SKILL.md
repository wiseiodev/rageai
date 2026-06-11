---
name: rage-scan
description: Scan local Claude and Codex transcripts for private Rage AI stats. Use when the user asks to scan, refresh, or set up Rage AI local stats.
---

Run the bundled Rage CLI scanner from this plugin's `bin/rage.js` file. First run `scan` so the
user can see discovered paths and file counts. Run `scan --confirm` only when the user wants to scan
those paths.

Prefer:

```bash
node "${PLUGIN_ROOT}/bin/rage.js" scan
```

Do not publish data. If the CLI shows discovered paths or privacy warnings, summarize them faithfully.

If `PLUGIN_ROOT` is unavailable in the shell, resolve `bin/rage.js` relative to this skill's
installed plugin root.
