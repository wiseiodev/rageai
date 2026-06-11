'use client'

import { authClient } from '@/lib/auth-client'

export function SignInWithGitHub() {
  return (
    <button
      className="rounded-md bg-zinc-950 px-3 py-2 text-center font-medium text-sm text-white"
      onClick={() => authClient.signIn.social({ provider: 'github' })}
      type="button"
    >
      Sign in with GitHub
    </button>
  )
}
