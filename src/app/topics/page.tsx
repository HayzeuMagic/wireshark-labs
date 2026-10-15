import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, PageHeader } from '@/components/page-header'
import { topics } from '@/content/topics'
import { contentForTopic } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Topics',
  description: 'Browse Rivan exercises, documentation, and tutorials by topic.',
}

export default function TopicsPage() {
  return (
    <Container>
      <PageHeader crumbs={[{ label: 'Topics' }]} kicker="Learning categories" title="Topics" description={<p>Every exercise, guide, and tutorial is tagged with one or more topics.</p>} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((t) => {
          const c = contentForTopic(t.slug)
          return (
            <li key={t.slug}>
              <Link href={`/topics/${t.slug}`} className="lab-surface block h-full p-5 transition-colors hover:border-slate-600">
                <h2 className="font-semibold text-white">{t.name}</h2>
                <p className="mt-1.5 text-[13px] leading-6 text-slate-400">{t.description}</p>
                <p className="mt-3 font-mono text-[11px] text-slate-500">
                  {c.exercises.length} exercises · {c.docs.length} docs · {c.tutorials.length} tutorials
                </p>
              </Link>
            </li>
          )
        })}
      </ul>
    </Container>
  )
}
