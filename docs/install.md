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
/rage:share --platform linkedin --tone professional
/rage:leaderboard
```

Publishing is a two-step flow. The first publish run previews the exact Claude and Codex payloads
and sends nothing. Rerun with `--confirm` only after reviewing the payload.

## Auth

Run `rage auth login --label "Wise Mac"` before publishing. The CLI opens the browser, waits while
you approve the device, and stores the publish token locally after approval. `rage auth complete`
is only a fallback for interrupted login attempts.

## Codex

Add the GitHub-backed marketplace:

```bash
codex plugin marketplace add wiseiodev/rageai --sparse .agents/plugins --sparse plugins/rage-codex
```

Install `rage` from the marketplace. Codex exposes Rage skills for scan, stats, publish, and
leaderboard workflows. It can also draft copy-ready share posts from an already-published public
score.

## Sharing

After publishing, use:

```bash
rage share --platform linkedin --tone professional
rage share --platform x --tone snark
```

Share drafts are local copy output. Rage AI does not connect to social accounts or post on your
behalf. Public share pages and card previews use only the aggregate leaderboard row data that was
already published.

## Local CLI State

The bundled CLI stores local state in:

```text
~/.config/rageai/state.json
```

This file contains a random install ID, saved transcript locations, last local summary, optional
public share URLs, and an optional publish token. It does not store raw transcripts.
