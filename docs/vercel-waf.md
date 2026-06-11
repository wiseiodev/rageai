# Vercel Firewall Setup

Rage AI uses two layers of rate limiting:

1. Vercel Firewall/WAF rules for cheap edge-side throttling and bot protection.
2. Upstash Redis limits inside the application for account/install/IP-bucket rules.

Create Vercel Firewall rate-limit IDs and map them to environment variables:

| Endpoint family | Env var | Suggested rule |
| --- | --- | --- |
| `/api/auth/device/*` | `VERCEL_WAF_AUTH_RATE_LIMIT_ID` | IP-based burst cap |
| `/api/publish` | `VERCEL_WAF_PUBLISH_RATE_LIMIT_ID` | IP or custom key cap |
| `/api/leaderboard` | `VERCEL_WAF_LEADERBOARD_RATE_LIMIT_ID` | light public read cap |
| `/api/admin/*` | `VERCEL_WAF_ADMIN_RATE_LIMIT_ID` | strict admin cap |

Enable Vercel Bot Protection and monitor the Firewall tab after launch.

The application still enforces product limits through Upstash:

- 20 publishes per account per day
- 10 publishes per install per day
- 50 publishes per HMAC IP bucket per day
