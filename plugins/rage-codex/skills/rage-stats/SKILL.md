---
name: rage-stats
description: Show local Rage AI stats without publishing. Use when the user asks for their local rage/frustration/swear stats.
---

Run the bundled Rage CLI with `stats`.

Prefer:

```bash
node "${PLUGIN_ROOT}/bin/rage.js" stats
```

Do not publish data or send network requests.

If `PLUGIN_ROOT` is unavailable in the shell, resolve `bin/rage.js` relative to this skill's
installed plugin root.
