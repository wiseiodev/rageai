# Environment Variables

Run this from the repo root to pull Vercel development environment variables into the web app:

```bash
pnpm env:dev
```

The script runs Vercel from the linked repo root and writes `apps/web/.env`. If the local checkout
has not been linked to a Vercel project yet, run `vercel link` from the repo root first.

For manual local setup, copy `.env.example` into `apps/web/.env`.

Database scripts load `apps/web/.env` before running Drizzle commands, so `pnpm db:migrate` and
`pnpm db:generate` use the same local development database settings.

Required for the web app:

- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `DATABASE_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RAGE_HMAC_SECRET`
- `ADMIN_GITHUB_LOGINS`

Use Neon pooled connection strings for `DATABASE_URL` on Vercel because the app uses the Node
`pg` driver.
