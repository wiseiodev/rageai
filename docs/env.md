# Environment Variables

Copy `.env.example` into `.env.local` for local development.

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
