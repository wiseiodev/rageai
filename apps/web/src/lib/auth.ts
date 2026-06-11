import { apiKey } from '@better-auth/api-key'
import { getDb } from '@rageai/db'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { appUrl } from './env'

const githubClientId = process.env.GITHUB_CLIENT_ID
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET

function authSecret() {
  if (process.env.BETTER_AUTH_SECRET) {
    return process.env.BETTER_AUTH_SECRET
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('BETTER_AUTH_SECRET is required in production')
  }
  return 'rageai-local-development-secret-change-before-production'
}

function createAuth() {
  return betterAuth({
    appName: 'Rage AI',
    baseURL: appUrl(),
    secret: authSecret(),
    database: drizzleAdapter(getDb(), {
      provider: 'pg',
    }),
    socialProviders:
      githubClientId && githubClientSecret
        ? {
            github: {
              clientId: githubClientId,
              clientSecret: githubClientSecret,
            },
          }
        : {},
    plugins: [
      apiKey({
        defaultPrefix: 'rage',
        rateLimit: {
          enabled: true,
          maxRequests: 20,
          timeWindow: 1000 * 60 * 60 * 24,
        },
      }),
    ],
  })
}

type RageAuth = ReturnType<typeof createAuth>

let auth: RageAuth | null = null

export function getAuth(): RageAuth {
  if (!auth) {
    auth = createAuth()
  }

  return auth
}
