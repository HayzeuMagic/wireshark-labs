import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, PageHeader } from '@/components/page-header'
import { exercises } from '@/content/exercises'
import { getTutorials } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Archive',
  description: 'Every Rivan exercise and tutorial in chronological order.',
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function ArchivePage() {
  const entries = [
    ...exercises.map((e) => ({ date: e.date, kind: 'Exercise', title: e.title, href: `/exercises/${e.slug}`, extra: { href: `/exercises/${e.slug}/answers`, label: 'answers' } })),
    ...getTutorials().map((t) => ({ date: t.date, kind: 'Tutorial', title: t.title, href: `/tutorials/${t.slug}`, extra: undefined })),
  ].sort((a, b) => b.date.localeCompare(a.date) || a.kind.localeCompare(b.kind))

  const byYear = new Map<string, Map<string, typeof entries>>()
  for (const e of entries) {
    const y = e.date.slice(0, 4)
    const m = monthNames[Number(e.date.slice(5, 7)) - 1]
    if (!byYear.has(y)) byYear.set(y, new Map())
    const months = byYear.get(y)!
    if (!months.has(m)) months.set(m, [])
    months.get(m)!.push(e)
  }

  return (
    <Container className="max-w-4xl">
      <PageHeader
        crumbs={[{ label: 'Archive' }]}
        kicker="Chronological index"
        title="Archive"
        description={<p>Exercises are dated by their scenario; tutorials by publication. Browse by topic on the <Link href="/topics" className="link">topics page</Link>.</p>}
      />
      {[...byYear].map(([year, months]) => (
        <section key={year} aria-labelledby={`y-${year}`} className="mb-12">
          <h2 id={`y-${year}`} className="mb-6 font-mono text-3xl font-bold text-white">
            {year}
          </h2>
          {[...months].map(([month, list]) => (
            <div key={month} className="mb-8">
              <h3 className="lab-kicker mb-3">{month}</h3>
              <ol className="lab-surface divide-y divide-border">
                {list.map((e) => (
                  <li key={e.href} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-4">
                    <time dateTime={e.date} className="shrink-0 font-mono text-[12px] text-slate-500">
                      {e.date}
                    </time>
                    <span className={`chip shrink-0 ${e.kind === 'Exercise' ? 'border-cyan-400/30 text-cyan-200' : 'border-violet-400/30 text-violet-300'}`}>{e.kind}</span>
                    <span className="min-w-0">
                      <Link href={e.href} className="font-medium text-slate-100 hover:text-cyan-300">
                        {e.title}
                      </Link>
                      {e.extra && (
                        <>
                          {' '}
                          <Link href={e.extra.href} className="text-[12.5px] text-slate-500 hover:text-cyan-300">
                            ({e.extra.label})
                          </Link>
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      ))}
    </Container>
  )
}
