# Privacy Model

Rage AI is local-first.

Local commands scan chat transcript files only after the user confirms the discovered paths. Local
stats stay in `~/.config/rageai/state.json`.

## Published Public Payload

Public leaderboard payloads include:

- chosen public handle
- host app (`claude` or `codex`)
- daily, weekly, and all-time aggregate windows
- user message count
- user word count
- scored profanity count
- rage hits per 1,000 user words
- top intensity bucket (`mild`, `standard`, `strong`)
- plugin version
- profanity ruleset version

Public payloads do not include raw transcript text, exact matched words, transcript paths, model
names, account IDs, GitHub usernames, or raw IP addresses.

## Public Share Pages

Share pages, generated card previews, and copy-ready X or LinkedIn drafts use only public aggregate
leaderboard row fields. Rage AI does not connect to social accounts, store social credentials, or
post on a user's behalf.

## Private Anti-Abuse Data

The publish request includes a random local install ID. The server stores HMAC-derived identifiers
for install, account, and IP time buckets to enforce rate limits and moderation. IP-derived buckets
are retained for 30 days.
