'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatDate } from '@/lib/utils'

export interface TutorialSummary {
  slug: string
  title: string
  description: string
  date: string
  topics: { slug: string; name: string }[]
}

export function TutorialBrowser({ tutorials, topics }: { tutorials: TutorialSummary[]; topics: { slug: string; name: string }[] }) {
  const [q, setQ] = useState('')
  const [topic, setTopic] = useState('')
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest')

  const visible = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
    return tutorials
      .filter((t) => !topic || t.topics.some((x) => x.slug === topic))
      .filter((t) => {
        const hay = `${t.title} ${t.description} ${t.topics.map((x) => x.name).join(' ')}`.toLowerCase()
        return terms.every((term) => hay.includes(term))
      })
      .sort((a, b) => (order === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)) || a.title.localeCompare(b.title))
  }, [tutorials, q, topic, order])

  return (
    <div>
      <div className="lab-surface grid gap-3 p-4 md:grid-cols-[1fr_220px_160px]">
        <div>
          <label htmlFor="tut-search" className="field-label">
            Search tutorials
          </label>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden />
            <input id="tut-search" type="search" className="field pl-9" placeholder="Technique, protocol, or tool…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="tut-topic" className="field-label">
            Topic
          </label>
          <select id="tut-topic" className="field" value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">All topics</option>
            {topics.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tut-order" className="field-label">
            Order
          </label>
          <select id="tut-order" className="field" value={order} onChange={(e) => setOrder(e.target.value as 'newest' | 'oldest')}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>
      <p className="mt-5 text-[13px] text-slate-400" role="status" aria-live="polite">
        {visible.length} of {tutorials.length} tutorials
      </p>
      {visible.length === 0 ? (
        <div className="lab-surface mt-4 p-8 text-center">
          <p className="font-medium text-white">No tutorials match.</p>
          <button
            type="button"
            className="btn-secondary btn-sm mt-4"
            onClick={() => {
              setQ('')
              setTopic('')
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ol className="mt-4 space-y-3">
          {visible.map((t) => (
            <li key={t.slug} className="lab-surface p-5">
              <time dateTime={t.date} className="font-mono text-[11px] text-slate-500">
                {formatDate(t.date)}
              </time>
              <h2 className="mt-1 text-lg font-semibold text-white">
                <Link href={`/tutorials/${t.slug}`} className="hover:text-cyan-300">
                  {t.title}
                </Link>
              </h2>
              <p className="mt-1.5 text-[13.5px] leading-6 text-slate-400">{t.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.topics.map((x) => (
                  <Link key={x.slug} href={`/topics/${x.slug}`} className="chip normal-case tracking-normal hover:text-white">
                    {x.name}
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
