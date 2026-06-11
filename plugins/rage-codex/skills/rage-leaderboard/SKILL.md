---
name: rage-leaderboard
description: Show the shared Rage AI leaderboard. Use when the user asks to view Rage AI rankings.
---

Run the bundled Rage CLI with `leaderboard` and summarize the returned rankings.

Prefer:

```bash
node "${PLUGIN_ROOT}/bin/rage.js" leaderboard
```

If `PLUGIN_ROOT` is unavailable in the shell, resolve `bin/rage.js` relative to this skill's
installed plugin root.
