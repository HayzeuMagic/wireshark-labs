'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { RotateCcw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ExerciseCard, type ExerciseSummary } from './exercise-card'

const PAGE_SIZE = 6
type FilterKey = 'year' | 'difficulty' | 'category' | 'protocol'

function unique(values: string[]) {
  return [...new Set(values)].sort()
}

export function ExerciseBrowser({ exercises }: { exercises: ExerciseSummary[] }) {
  const pathname = usePathname()
  const params = useSearchParams()

  const [q, setQ] = useState(() => params.get('q') ?? '')
  const filters: Record<FilterKey, string> = {
    year: params.get('year') ?? '',
    difficulty: params.get('difficulty') ?? '',
    category: params.get('category') ?? '',
    protocol: params.get('protocol') ?? '',
  }
  const beginner = params.get('beginner') === '1'
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)

  const options = useMemo(
    () => ({
      year: unique(exercises.map((e) => e.date.slice(0, 4))).reverse(),
      difficulty: ['Beginner', 'Intermediate', 'Advanced'],
      category: unique(exercises.map((e) => e.category)),
      protocol: unique(exercises.flatMap((e) => e.protocols)),
    }),
    [exercises],
  )

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v)
      else sp.delete(k)
    }
    if (!('page' in next)) sp.delete('page')
    const qs = sp.toString()
    // Native history updates keep useSearchParams in sync without a server round trip.
    window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname)
  }

  function reset() {
    setQ('')
    window.history.replaceState(null, '', pathname)
  }

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
    return exercises
      .filter((e) => {
        if (filters.year && !e.date.startsWith(filters.year)) return false
        if (filters.difficulty && e.difficulty !== filters.difficulty) return false
        if (filters.category && e.category !== filters.category) return false
        if (filters.protocol && !e.protocols.includes(filters.protocol)) return false
        if (beginner && !e.beginnerFriendly) return false
        if (terms.length) {
          const hay = [e.title, e.summary, e.category, e.difficulty, e.date, ...e.protocols, ...e.topics.map((t) => t.name)].join(' ').toLowerCase()
          if (!terms.every((t) => hay.includes(t))) return false
        }
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, q, filters.year, filters.difficulty, filters.category, filters.protocol, beginner])

  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const active = Boolean(q || beginner || Object.values(filters).some(Boolean))

  const selects: { key: FilterKey; label: string; all: string }[] = [
    { key: 'year', label: 'Year', all: 'All years' },
    { key: 'difficulty', label: 'Difficulty', all: 'All levels' },
    { key: 'category', label: 'Category', all: 'All categories' },
    { key: 'protocol', label: 'Protocol', all: 'All protocols' },
  ]

  return (
    <div>
      <form role="search" className="lab-surface p-4 sm:p-5" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="exercise-search" className="field-label">
          Search exercises
        </label>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden />
          <input
            id="exercise-search"
            type="search"
            className="field pl-9"
            placeholder="Malware family, protocol, technique, date…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              update({ q: e.target.value || null })
            }}
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {selects.map((s) => (
            <div key={s.key}>
              <label htmlFor={`f-${s.key}`} className="field-label">
                {s.label}
              </label>
              <select id={`f-${s.key}`} className="field" value={filters[s.key]} onChange={(e) => update({ [s.key]: e.target.value || null })}>
                <option value="">{s.all}</option>
                {options[s.key].map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input bg-transparent accent-cyan-400"
              checked={beginner}
              onChange={(e) => update({ beginner: e.target.checked ? '1' : null })}
            />
            Beginner-friendly only
          </label>
          {active && (
            <button type="button" className="btn-ghost btn-sm" onClick={reset}>
              <RotateCcw size={13} aria-hidden /> Clear filters
            </button>
          )}
        </div>
      </form>

      <p className="mt-6 text-[13px] text-slate-400" role="status" aria-live="polite">
        {results.length === exercises.length ? `Showing all ${results.length} exercises` : `${results.length} of ${exercises.length} exercises match`}
        {pages > 1 && ` · page ${current} of ${pages}`}
      </p>

      {visible.length ? (
        <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((e) => (
            <ExerciseCard key={e.slug} e={e} headingLevel="h2" />
          ))}
        </div>
      ) : (
        <div className="lab-surface mt-4 p-8 text-center">
          <p className="font-medium text-white">No exercises match these filters.</p>
          <p className="mt-2 text-[13.5px] text-slate-400">Try a broader search term, or clear one of the filters.</p>
          <button type="button" className="btn-secondary btn-sm mt-4" onClick={reset}>
            <RotateCcw size={13} aria-hidden /> Reset all filters
          </button>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
          <button type="button" className="btn-secondary btn-sm" disabled={current <= 1} onClick={() => update({ page: String(current - 1) })}>
            Previous
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              aria-current={p === current ? 'page' : undefined}
              className={p === current ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
              onClick={() => update({ page: String(p) })}
            >
              {p}
            </button>
          ))}
          <button type="button" className="btn-secondary btn-sm" disabled={current >= pages} onClick={() => update({ page: String(current + 1) })}>
            Next
          </button>
        </nav>
      )}
    </div>
  )
}
