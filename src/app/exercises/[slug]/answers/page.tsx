import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { AnswerKey, Assessment, Remediation, Timeline } from '@/components/answer-parts'
import { AnswerStatusBadge } from '@/components/badges'
import { IocTable, PacketView } from '@/components/evidence'
import { Container, PageHeader } from '@/components/page-header'
import { Prose } from '@/components/prose'
import { Spoiler } from '@/components/reveal'
import { exercises, getExercise } from '@/content/exercises'
import { getWalkthrough } from '@/lib/content'

export function generateStaticParams() {
  return exercises.map((e) => ({ slug: e.slug }))
}
export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = getExercise((await params).slug)
  return e ? { title: `Answers: ${e.title}`, description: `Verified walkthrough and incident report for ${e.title}.` } : {}
}

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24">
      <h2 id={id} className="mb-4 border-b border-border pb-2 text-xl font-semibold tracking-tight text-white">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default async function ExerciseAnswersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = getExercise(slug)
  if (!e) notFound()
  const walkthrough = await getWalkthrough(slug)

  if (e.answerStatus === 'awaiting-validation') {
    return (
      <Container>
        <PageHeader crumbs={[{ href: '/exercises', label: 'Exercises' }, { href: `/exercises/${e.slug}`, label: e.date }, { label: 'Answers' }]} title={`Answers: ${e.title}`}>
          <AnswerStatusBadge status={e.answerStatus} />
        </PageHeader>
        <p className="text-slate-300">This solution is still being validated against the evidence and is not published yet.</p>
      </Container>
    )
  }

  return (
    <Container className="max-w-5xl">
      <PageHeader
        crumbs={[{ href: '/answers', label: 'Answers' }, { href: `/exercises/${e.slug}`, label: e.date }, { label: 'Answer report' }]}
        kicker="Answer report and walkthrough"
        title={`Answers: ${e.title}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <AnswerStatusBadge status={e.answerStatus} />
          <span className="text-[13px] text-slate-400">
            Reproduced {e.verification.date}. {e.verification.method}
          </span>
        </div>
        <Link href={`/exercises/${e.slug}`} className="btn-ghost btn-sm mt-4">
          <ArrowLeft size={14} aria-hidden /> Back to the exercise
        </Link>
      </PageHeader>

      <aside className="callout callout-warning mb-6 text-slate-300" role="note">
        <p className="callout-title flex items-center gap-2">
          <TriangleAlert size={13} aria-hidden /> Spoiler warning
        </p>
        <p>
          This page contains the complete solution. If you have not worked the exercise yet, start with the{' '}
          <Link href={`/exercises/${e.slug}#questions`} className="link">
            questions
          </Link>{' '}
          and{' '}
          <Link href={`/exercises/${e.slug}#hints`} className="link">
            hints
          </Link>
          .
        </p>
      </aside>

      <Spoiler label="Reveal the full solution" warning="Everything below answers the exercise">
        <div className="space-y-12">
          <Block id="summary" title="Incident summary">
            <p className="text-[15px] leading-7 text-slate-300">{e.incidentSummary}</p>
          </Block>

          <Block id="answers" title="Answers and supporting evidence">
            <AnswerKey exercise={e} />
          </Block>

          <Block id="methodology" title="Investigation methodology">
            {walkthrough ? <Prose html={walkthrough.html} /> : <p className="text-slate-400">Walkthrough not yet published.</p>}
          </Block>

          <Block id="observations" title="Key observations">
            <div className="space-y-6">
              {e.evidenceViews.map((v) => (
                <PacketView key={v.id} view={v} />
              ))}
            </div>
          </Block>

          <Block id="iocs" title="Indicators of compromise">
            <IocTable iocs={e.iocs} />
          </Block>

          <Block id="timeline" title="Timeline of events">
            <Timeline exercise={e} />
          </Block>

          <Block id="assessment" title="Root cause, confidence, and limitations">
            <Assessment exercise={e} />
          </Block>

          <Block id="remediation" title="Remediation recommendations">
            <Remediation exercise={e} />
          </Block>
        </div>
      </Spoiler>
    </Container>
  )
}
