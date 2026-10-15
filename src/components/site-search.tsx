'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { SearchEntry } from '@/lib/content'

function score(e: SearchEntry, terms: string[]): number {
  let s = 0
  const title = e.title.toLowerCase()
  const desc = e.description.toLowerCase()
  const kw = e.keywords.toLowerCase()
  for (const t of terms) {
    if (title.includes(t)) s += 5
    else if (desc.includes(t)) s += 2
    else if (kw.includes(t)) s += 1
    else return 0
  }
  return s
}

export function SiteSearch({ index }: { index: SearchEntry[] }) {
  const params = useSearchParams()
  const pathname = usePathname()
  const [q, setQ] = useState(() => params.get('q') ?? '')
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  const results = useMemo(
    () =>
      terms.length
        ? index
            .map((e) => ({ e, s: score(e, terms) }))
            .filter((x) => x.s > 0)
            .sort((a, b) => b.s - a.s)
            .map((x) => x.e)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, q],
  )

  return (
    <div>
      <form role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="site-search" className="field-label">
          Search the lab
        </label>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden />
          <input
            id="site-search"
            type="search"
            autoFocus
            className="field h-11 pl-10"
            placeholder="Exercises, docs, tutorials, indicators…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              window.history.replaceState(null, '', e.target.value ? `${pathname}?q=${encodeURIComponent(e.target.value)}` : pathname)
            }}
          />
        </div>
      </form>
      <p className="mt-5 text-[13px] text-slate-400" role="status" aria-live="polite">
        {terms.length ? `${results.length} result${results.length === 1 ? '' : 's'} for “${q}”` : `Type to search ${index.length} pages.`}
      </p>
      {terms.length > 0 && results.length === 0 && (
        <div className="lab-surface mt-4 p-6">
          <p className="font-medium text-white">No results.</p>
          <p className="mt-1 text-[13.5px] text-slate-400">
            Try a protocol (dns, kerberos), a malware family (Lumma, NetSupport), a technique (beacon, ClickFix), or browse the{' '}
            <Link href="/topics" className="link">
              topics
            </Link>
            .
          </p>
        </div>
      )}
      <ul className="mt-4 space-y-3">
        {results.map((r) => (
          <li key={r.href} className="lab-surface p-4">
            <p className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
              <span className="chip">{r.kind}</span>
              {r.date}
            </p>
            <Link href={r.href} className="mt-2 block font-medium text-slate-100 hover:text-cyan-300">
              {r.title}
            </Link>
            <p className="mt-1 text-[13px] leading-6 text-slate-400">{r.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
