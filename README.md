# Rage AI

Rage AI is a local-first frustration leaderboard for Claude Code and Codex. It scans opted-in local chat transcripts for profanity, shows private stats, and publishes only aggregate self-reported scores when a user explicitly confirms the payload.

## Stack

- pnpm 11 + Turborepo
- Next.js App Router on Vercel
- Better Auth with GitHub OAuth and API-key publish tokens
- Neon Postgres via Drizzle ORM and `pg`
- Upstash Redis for product rate limits
- Copy-ready X and LinkedIn share drafts from public aggregate scores
- Biome, Vitest, Playwright, and `@wiseiodev/guardrails`

## Development

```bash
pnpm install
pnpm checks
pnpm dev
```

Database migrations are explicit:

```bash
pnpm db:generate
pnpm db:migrate
```

Build host plugin artifacts:

```bash
pnpm plugin:build
```

## Distribution

- Claude marketplace: `.claude-plugin/marketplace.json`
- Codex marketplace: `.agents/plugins/marketplace.json`
- Host plugin ID: `rage`
- Product domain: `https://rageai.dev`

See [docs/install.md](docs/install.md), [docs/privacy.md](docs/privacy.md), and [docs/vercel-waf.md](docs/vercel-waf.md).
