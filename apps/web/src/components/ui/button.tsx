import type * as React from 'react'
import { cn } from '@/lib/utils'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

const variants = {
  primary: 'bg-zinc-950 text-white hover:bg-zinc-800',
  secondary: 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200',
  ghost: 'bg-transparent text-zinc-700 hover:bg-zinc-100',
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
