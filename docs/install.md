# Install Rage AI

Rage AI distributes host plugins from `wiseiodev/rageai`.

## Claude Code

Add the marketplace:

```bash
/plugin marketplace add wiseiodev/rageai
```

Install the `rage` plugin, then use:

```bash
/rage:scan
/rage:stats
/rage:publish --handle your_handle
/rage:leaderboard
```

Publishing is a two-step flow. The first publish run previews the exact Claude and Codex payloads
and sends nothing. Rerun with `--confirm` only after reviewing the payload.

## Codex

Add the GitHub-backed marketplace:

```bash
codex plugin marketplace add wiseiodev/rageai --sparse .agents/plugins --sparse plugins/rage-codex
```

Install `rage` from the marketplace. Codex exposes Rage skills for scan, stats, publish, and
leaderboard workflows.

## Local CLI State

The bundled CLI stores local state in:

```text
~/.config/rageai/state.json
```

This file contains a random install ID, saved transcript locations, last local summary, and an
optional publish token. It does not store raw transcripts.
