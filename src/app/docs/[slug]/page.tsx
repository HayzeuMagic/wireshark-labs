import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock, FlaskConical } from 'lucide-react'
import { Container, PageHeader } from '@/components/page-header'
import { Prose } from '@/components/prose'
import { TableOfContents } from '@/components/toc'
import { getExercise } from '@/content/exercises'
import { getDoc, getDocs } from '@/lib/content'

export function generateStaticParams() {
  return getDocs().map((d) => ({ slug: d.slug }))
}
export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const d = getDocs().find((x) => x.slug === slug)
  return d ? { title: `Step ${d.step}: ${d.title}`, description: d.description } : {}
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = await getDoc(slug)
  if (!doc) notFound()
  const { meta } = doc
  const exercises = meta.exercises.map(getExercise).filter((x): x is NonNullable<typeof x> => Boolean(x))

  return (
    <Container>
      <PageHeader crumbs={[{ href: '/docs', label: 'Lab setup' }, { label: `Step ${meta.step}` }]} kicker={`Step ${meta.step} of ${doc.total}`} title={meta.title} description={<p>{meta.description}</p>}>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-slate-400">
            <Clock size={13} aria-hidden /> About {meta.minutes} minutes
          </span>
          {/* Progress through the guide */}
          <div className="flex gap-1" aria-hidden>
            {Array.from({ length: doc.total }, (_, i) => (
              <span key={i} className={`h-1.5 w-6 rounded-full ${i < meta.step ? 'bg-cyan-300' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_220px]">
        <article className="min-w-0 max-w-3xl">
          <Prose html={doc.html} />

          {exercises.length > 0 && (
            <aside className="lab-surface mt-10 p-4">
              <p className="lab-kicker mb-2 flex items-center gap-2">
                <FlaskConical size={12} aria-hidden /> Practice this step
              </p>
              <ul className="space-y-1.5 text-[14px]">
                {exercises.map((e) => (
                  <li key={e.slug}>
                    <Link href={`/exercises/${e.slug}`} className="link">
                      {e.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <nav aria-label="Guide navigation" className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
            {doc.prev ? (
              <Link href={`/docs/${doc.prev.slug}`} className="btn-ghost justify-start">
                <ArrowLeft size={15} aria-hidden /> Step {doc.prev.step}: {doc.prev.title}
              </Link>
            ) : (
              <Link href="/docs" className="btn-ghost justify-start">
                <ArrowLeft size={15} aria-hidden /> All steps
              </Link>
            )}
            {doc.next ? (
              <Link href={`/docs/${doc.next.slug}`} className="btn-primary">
                Next: Step {doc.next.step}, {doc.next.title} <ArrowRight size={15} aria-hidden />
              </Link>
            ) : (
              <Link href="/exercises" className="btn-primary">
                Go to the exercises <ArrowRight size={15} aria-hidden />
              </Link>
            )}
          </nav>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6">
            <TableOfContents items={doc.toc} title="In this step" />
          </div>
        </aside>
      </div>
    </Container>
  )
}
