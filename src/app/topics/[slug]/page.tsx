import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExerciseCard } from '@/components/exercise-card'
import { Container, PageHeader, SectionHeading } from '@/components/page-header'
import { getTopic, topics } from '@/content/topics'
import { contentForTopic } from '@/lib/content'
import { toSummary } from '@/lib/site'
import { formatDate } from '@/lib/utils'

export function generateStaticParams() {
  return topics.map((t) => ({ slug: t.slug }))
}
export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = getTopic((await params).slug)
  return t ? { title: `Topic: ${t.name}`, description: t.description } : {}
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const topic = getTopic(slug)
  if (!topic) notFound()
  const c = contentForTopic(slug)
  const empty = !c.exercises.length && !c.docs.length && !c.tutorials.length

  return (
    <Container>
      <PageHeader crumbs={[{ href: '/topics', label: 'Topics' }, { label: topic.name }]} kicker="Topic" title={topic.name} description={<p>{topic.description}</p>} />
      {empty && <p className="text-slate-400">Nothing is tagged with this topic yet.</p>}

      {c.exercises.length > 0 && (
        <section className="mb-12" aria-labelledby="t-ex">
          <SectionHeading id="t-ex" title={`Exercises (${c.exercises.length})`} />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...c.exercises]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((e) => (
                <ExerciseCard key={e.slug} e={toSummary(e)} />
              ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {c.docs.length > 0 && (
          <section aria-labelledby="t-docs">
            <SectionHeading id="t-docs" title={`Documentation (${c.docs.length})`} />
            <ul className="lab-surface divide-y divide-border">
              {c.docs.map((d) => (
                <li key={d.slug} className="p-4">
                  <Link href={`/docs/${d.slug}`} className="font-medium text-slate-100 hover:text-cyan-300">
                    {d.title}
                  </Link>
                  <p className="mt-0.5 text-[13px] text-slate-400">{d.description}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
        {c.tutorials.length > 0 && (
          <section aria-labelledby="t-tut">
            <SectionHeading id="t-tut" title={`Tutorials (${c.tutorials.length})`} />
            <ul className="lab-surface divide-y divide-border">
              {c.tutorials.map((t) => (
                <li key={t.slug} className="p-4">
                  <Link href={`/tutorials/${t.slug}`} className="font-medium text-slate-100 hover:text-cyan-300">
                    {t.title}
                  </Link>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500">{formatDate(t.date)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Container>
  )
}
