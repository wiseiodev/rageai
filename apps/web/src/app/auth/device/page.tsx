import { headers } from 'next/headers'
import { SignInWithGitHub } from '@/components/sign-in-with-github'
import { getAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function DevicePage({
  searchParams,
}: {
  searchParams: Promise<{ approved?: string; code?: string }>
}) {
  const params = await searchParams
  const callbackURL = params.code
    ? `/auth/device?code=${encodeURIComponent(params.code)}`
    : '/auth/device'
  const session = await getAuth()
    .api.getSession({ headers: await headers() })
    .catch(() => null)

  return (
    <article className="mx-auto grid max-w-md gap-5 px-4 py-8">
      <h1 className="font-semibold text-3xl">Approve Rage CLI</h1>
      {params.approved ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 text-sm">
          Device approved. You can return to the terminal.
        </div>
      ) : null}
      {session ? (
        <form action="/api/auth/device/approve" className="grid gap-3" method="post">
          <label className="grid gap-1 text-sm">
            Device code
            <input
              className="rounded-md border border-zinc-300 px-3 py-2"
              defaultValue={params.code ?? ''}
              name="userCode"
              required
            />
          </label>
          <p className="text-sm text-zinc-600">
            This stores a local publish token for this device. You can choose your public handle
            when publishing.
          </p>
          <button
            className="rounded-md bg-zinc-950 px-3 py-2 font-medium text-sm text-white"
            type="submit"
          >
            Approve device
          </button>
        </form>
      ) : (
        <div className="grid gap-3">
          <p className="text-zinc-600">Sign in with GitHub before approving a device.</p>
          <SignInWithGitHub callbackURL={callbackURL} />
        </div>
      )}
    </article>
  )
}
