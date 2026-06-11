import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rage AI',
  description: 'A local-first frustration leaderboard for Claude Code and Codex.',
  metadataBase: new URL('https://rageai.dev'),
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="border-zinc-200 border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link className="font-semibold text-lg" href="/">
              Rage AI
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-600">
              <Link href="/leaderboard">Leaderboard</Link>
              <Link href="/install">Install</Link>
              <Link href="/privacy">Privacy</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
