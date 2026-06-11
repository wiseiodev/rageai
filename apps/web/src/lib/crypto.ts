import { createHmac, randomBytes } from 'node:crypto'
import { hmacSecret } from './env'

export function hmacIdentifier(value: string): string {
  return createHmac('sha256', hmacSecret()).update(value).digest('hex')
}

export function randomToken(prefix: string): string {
  return `${prefix}_${randomBytes(32).toString('base64url')}`
}

export function userCode(): string {
  return randomBytes(4)
    .toString('base64url')
    .replace(/[^a-zA-Z0-9]/gu, '')
    .slice(0, 6)
    .toUpperCase()
}

export function ipBucket(request: Request, window: 'day' | 'month' = 'day'): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwarded || request.headers.get('x-real-ip') || 'unknown'
  const now = new Date()
  const bucket =
    window === 'day'
      ? `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`
      : `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`
  return hmacIdentifier(`${window}:${bucket}:${ip}`)
}
