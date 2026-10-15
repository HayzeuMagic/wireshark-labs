'use client'

import { ChevronRight, Eye, Lightbulb } from 'lucide-react'
import { useState, type ReactNode } from 'react'

/**
 * Spoiler gate built on <details>, so the content is in the HTML (searchable, works without
 * JavaScript, readable by assistive technology) but collapsed until the reader opens it.
 */
export function Spoiler({ label, warning, children, defaultOpen = false }: { label: string; warning: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group rounded-lg border border-amber-400/25 bg-amber-400/[0.04]" open={defaultOpen}>
      <summary className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm font-medium text-amber-100 hover:bg-amber-400/[0.06]">
        <ChevronRight size={16} className="chevron text-amber-300" aria-hidden />
        <Eye size={15} aria-hidden className="text-amber-300" />
        <span>{label}</span>
        <span className="ml-auto text-[12px] font-normal text-amber-200/70 group-open:hidden">{warning}</span>
      </summary>
      <div className="border-t border-amber-400/20 px-4 py-5">{children}</div>
    </details>
  )
}

export function ProgressiveHints({ hints }: { hints: string[] }) {
  const [shown, setShown] = useState(0)
  return (
    <div>
      <ol className="space-y-2">
        {hints.slice(0, shown).map((h, i) => (
          <li key={i} className="lab-surface flex gap-3 p-3 text-[14px] leading-6 text-slate-300">
            <span className="font-mono text-[11px] font-semibold text-amber-300">HINT {i + 1}</span>
            <span>{h}</span>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {shown < hints.length ? (
          <button type="button" className="btn-secondary btn-sm" onClick={() => setShown((s) => s + 1)}>
            <Lightbulb size={14} aria-hidden /> Show hint {shown + 1} of {hints.length}
          </button>
        ) : (
          <p className="text-[13px] text-slate-500">All {hints.length} hints shown.</p>
        )}
        {shown > 0 && (
          <button type="button" className="btn-ghost btn-sm" onClick={() => setShown(0)}>
            Hide hints
          </button>
        )}
      </div>
      <noscript>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-[14px] text-slate-300">
          {hints.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ol>
      </noscript>
    </div>
  )
}
