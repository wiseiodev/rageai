import { toNextJsHandler } from 'better-auth/next-js'
import { getAuth } from '@/lib/auth'

export const runtime = 'nodejs'

function authSetupError() {
  return Response.json(
    {
      ok: false,
      message: 'Authentication is not configured. Set DATABASE_URL and Better Auth env vars.',
    },
    { status: 503 },
  )
}

export async function GET(request: Request) {
  try {
    return toNextJsHandler(getAuth()).GET(request)
  } catch {
    return authSetupError()
  }
}

export async function POST(request: Request) {
  try {
    return toNextJsHandler(getAuth()).POST(request)
  } catch {
    return authSetupError()
  }
}
