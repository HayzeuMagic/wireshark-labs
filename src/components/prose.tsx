'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { copyText } from './copy-button'

/**
 * Renders HTML produced at build time by src/lib/markdown.ts and wires up the copy
 * buttons inside code blocks through event delegation.
 */
export function Prose({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const onClick = async (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-copy]')
      if (!btn) return
      const code = btn.closest('figure')?.querySelector('pre')?.innerText ?? ''
      const ok = await copyText(code.replace(/\n$/, ''))
      btn.dataset.state = ok ? 'copied' : 'error'
      btn.textContent = ok ? 'Copied' : 'Copy failed'
      setTimeout(() => {
        btn.dataset.state = ''
        btn.textContent = 'Copy'
      }, 1800)
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [])

  return <div ref={ref} className={cn('prose-lab', className)} dangerouslySetInnerHTML={{ __html: html }} />
}
