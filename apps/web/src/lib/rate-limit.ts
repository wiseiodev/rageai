import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { checkRateLimit } from '@vercel/firewall'

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null

function limiter(prefix: string, max: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`) {
  if (!redis) {
    return null
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, window),
    analytics: true,
    prefix,
  })
}

export async function checkWaf(
  id: string | undefined,
  request: Request,
  rateLimitKey?: string,
): Promise<Response | null> {
  if (!id) {
    return null
  }
  try {
    const options = rateLimitKey ? { request, rateLimitKey } : { request }
    const { rateLimited } = await checkRateLimit(id, options)
    if (rateLimited) {
      return Response.json({ ok: false, message: 'Rate limit exceeded' }, { status: 429 })
    }
  } catch {
    return null
  }
  return null
}

export async function checkUpstash(
  key: string,
  max: number,
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`,
  prefix: string,
): Promise<Response | null> {
  const activeLimiter = limiter(prefix, max, window)
  if (!activeLimiter) {
    return null
  }
  const result = await activeLimiter.limit(key)
  if (!result.success) {
    return Response.json(
      {
        ok: false,
        message: 'Rate limit exceeded',
        reset: result.reset,
      },
      { status: 429 },
    )
  }
  return null
}
