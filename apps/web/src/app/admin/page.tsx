import { headers } from 'next/headers'
import { getAuth } from '@/lib/auth'
import { adminLogins } from '@/lib/env'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getAuth()
    .api.getSession({ headers: await headers() })
    .catch(() => null)
  const login = session?.user.name?.toLowerCase() ?? ''

  if (!session || !adminLogins().has(login)) {
    return <div className="mx-auto max-w-3xl px-4 py-8">Not found.</div>
  }

  return (
    <article className="mx-auto grid max-w-3xl gap-4 px-4 py-8">
      <h1 className="font-semibold text-3xl">Admin</h1>
      <p className="text-zinc-600">
        Use the score hide endpoint from leaderboard tooling while the moderation UI is
        intentionally minimal.
      </p>
    </article>
  )
}
