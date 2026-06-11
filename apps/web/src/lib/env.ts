export function appUrl(): string {
  return (
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_RAGE_API_URL ?? 'http://localhost:3000'
  )
}

export function hmacSecret(): string {
  return process.env.RAGE_HMAC_SECRET ?? 'development-rage-hmac-secret-change-me'
}

export function adminLogins(): Set<string> {
  return new Set(
    (process.env.ADMIN_GITHUB_LOGINS ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  )
}
