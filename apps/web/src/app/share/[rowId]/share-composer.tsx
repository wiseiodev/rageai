'use client'

import {
  createShareDraft,
  type SharePlatform,
  type ShareScore,
  type ShareTone,
  type WindowKind,
} from '@rageai/core/share'
import { Copy, Link2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ShareComposerProps = {
  handle: string
  window: WindowKind
  shareUrl: string
  scores: ShareScore[]
}

type CopyTarget = 'post' | 'url' | null

function labelClass(active: boolean): string {
  return cn(
    'h-9 rounded-md border px-3 text-sm font-medium transition-colors',
    active
      ? 'border-zinc-950 bg-zinc-950 text-white'
      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100',
  )
}

export function ShareComposer({ handle, window, shareUrl, scores }: ShareComposerProps) {
  const [platform, setPlatform] = useState<SharePlatform>('linkedin')
  const [tone, setTone] = useState<ShareTone>('professional')
  const [copied, setCopied] = useState<CopyTarget>(null)

  const draft = useMemo(
    () =>
      createShareDraft({
        handle,
        platform,
        tone,
        window,
        url: shareUrl,
        scores,
      }),
    [handle, platform, scores, shareUrl, tone, window],
  )

  async function copy(value: string, target: CopyTarget) {
    await navigator.clipboard.writeText(value)
    setCopied(target)
    globalThis.setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          aria-pressed={platform === 'linkedin'}
          className={labelClass(platform === 'linkedin')}
          onClick={() => setPlatform('linkedin')}
          type="button"
        >
          LinkedIn
        </button>
        <button
          aria-pressed={platform === 'x'}
          className={labelClass(platform === 'x')}
          onClick={() => setPlatform('x')}
          type="button"
        >
          X
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          aria-pressed={tone === 'professional'}
          className={labelClass(tone === 'professional')}
          onClick={() => setTone('professional')}
          type="button"
        >
          Professional
        </button>
        <button
          aria-pressed={tone === 'snark'}
          className={labelClass(tone === 'snark')}
          onClick={() => setTone('snark')}
          type="button"
        >
          Snark
        </button>
      </div>

      <textarea
        className="min-h-44 resize-none rounded-md border border-zinc-200 bg-white p-4 text-sm leading-6 shadow-sm outline-none focus:border-zinc-400"
        readOnly
        value={draft.text}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => copy(draft.text, 'post')} type="button">
          <Copy aria-hidden="true" className="mr-2 size-4" />
          {copied === 'post' ? 'Copied' : 'Copy post'}
        </Button>
        <Button onClick={() => copy(shareUrl, 'url')} type="button" variant="secondary">
          <Link2 aria-hidden="true" className="mr-2 size-4" />
          {copied === 'url' ? 'Copied' : 'Copy link'}
        </Button>
        <span className="text-sm text-zinc-500">{draft.characterCount} characters</span>
      </div>
    </div>
  )
}
