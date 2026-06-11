---
name: rage-share
description: Generate copy-ready X or LinkedIn posts for a published Rage AI score. Use when the user asks to share or draft a social post from Rage AI stats.
---

Run the bundled Rage CLI with `share`. This generates local copy only; it must not publish data or
post to social networks.

Prefer:

```bash
node "${PLUGIN_ROOT}/bin/rage.js" share --platform linkedin --tone professional
```

Use `--platform x` or `--tone snark` when the user requests that style. If `PLUGIN_ROOT` is
unavailable in the shell, resolve `bin/rage.js` relative to this skill's installed plugin root.
