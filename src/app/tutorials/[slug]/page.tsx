import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, Clock, ExternalLink } from 'lucide-react'
import { TopicChip } from '@/components/badges'
import { DownloadList } from '@/components/download-list'
import { Container, PageHeader } from '@/components/page-header'
import { Prose } from '@/components/prose'
import { TableOfContents } from '@/components/toc'
import { getExercise } from '@/content/exercises'
import { getDocs, getTutorial, getTutorials } from '@/lib/content'
import { downloadsForExercise } from '@/lib/downloads'
import { formatDate } from '@/lib/utils'

export function generateStaticParams() {
  return getTutorials().map((t) => ({ slug: t.slug }))
}
export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const t = getTutorials().find((x) => x.slug === slug)
  return t ? { title: t.title, description: t.description } : {}
}

export default async function TutorialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const t = await getTutorial(slug)
  if (!t) notFound()
  const { meta } = t
  const exercises = meta.exercises.map(getExercise).filter((x): x is NonNullable<typeof x> => Boolean(x))
  const docs = getDocs().filter((d) => meta.docs.includes(d.slug))
  const relatedPosts = getTutorials().filter((x) => x.slug !== slug && x.topics.some((tp) => meta.topics.includes(tp)))
  const files = exercises.flatMap((e) => downloadsForExercise(e.slug))

  return (
    <Container>
      <PageHeader crumbs={[{ href: '/tutorials', label: 'Tutorials' }, { label: meta.title }]} kicker="Tutorial" title={meta.title} description={<p>{meta.description}</p>}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip normal-case tracking-normal">
            <Calendar size={11} aria-hidden /> {formatDate(meta.date)}
          </span>
          <span className="chip normal-case tracking-normal">
            <Clock size={11} aria-hidden /> {t.minutes} min read
          </span>
          {meta.topics.map((s) => (
            <TopicChip key={s} slug={s} />
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px]">
        <article className="min-w-0">
          <Prose html={t.html} />

          {files.length > 0 && (
            <section className="mt-12" aria-labelledby="files">
              <h2 id="files" className="mb-4 border-b border-border pb-2 text-xl font-semibold text-white">
                Captures for this tutorial
              </h2>
              <DownloadList items={files} />
            </section>
          )}

          <section className="mt-12 grid gap-8 md:grid-cols-2" aria-label="Related content">
            {exercises.length > 0 && (
              <div>
                <h2 className="lab-kicker mb-3">Associated exercises</h2>
                <ul className="space-y-2 text-[14px]">
                  {exercises.map((e) => (
                    <li key={e.slug}>
                      <Link href={`/exercises/${e.slug}`} className="link">
                        {e.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {docs.length > 0 && (
              <div>
                <h2 className="lab-kicker mb-3">Guide steps this builds on</h2>
                <ul className="space-y-2 text-[14px]">
                  {docs.map((d) => (
                    <li key={d.slug}>
                      <Link href={`/docs/${d.slug}`} className="link">
                        Step {d.step}: {d.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {meta.references.length > 0 && (
              <div>
                <h2 className="lab-kicker mb-3">References and further reading</h2>
                <ul className="space-y-2 text-[14px]">
                  {meta.references.map((r) => (
                    <li key={r.href}>
                      <a href={r.href} target="_blank" rel="noopener noreferrer" className="link">
                        {r.title} <ExternalLink size={11} className="inline" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {relatedPosts.length > 0 && (
              <div>
                <h2 className="lab-kicker mb-3">Related tutorials</h2>
                <ul className="space-y-2 text-[14px]">
                  {relatedPosts.slice(0, 4).map((r) => (
                    <li key={r.slug}>
                      <Link href={`/tutorials/${r.slug}`} className="link">
                        {r.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6">
            <TableOfContents items={t.toc} />
          </div>
        </aside>
      </div>
    </Container>
  )
}
