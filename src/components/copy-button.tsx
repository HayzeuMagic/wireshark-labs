'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = value
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  }
}

export function CopyButton({ value, label = 'Copy', className }: { value: string; label?: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle')
  return (
    <button
      type="button"
      className={cn('btn-ghost btn-sm h-7 min-h-0 px-2 font-mono text-[11px]', state === 'copied' && 'text-emerald-300', state === 'error' && 'text-red-300', className)}
      onClick={async () => {
        setState((await copyText(value)) ? 'copied' : 'error')
        setTimeout(() => setState('idle'), 1800)
      }}
      aria-label={`${label}: ${value.length > 40 ? 'value' : value}`}
    >
      {state === 'copied' ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
      <span aria-live="polite">{state === 'copied' ? 'Copied' : state === 'error' ? 'Copy failed' : label}</span>
    </button>
  )
}
