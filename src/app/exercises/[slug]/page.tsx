import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Calendar, Clock, ExternalLink, ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { AnswerKey, Assessment, Remediation, Timeline } from '@/components/answer-parts'
import { AnswerStatusBadge, DifficultyBadge, TopicChip } from '@/components/badges'
import { DownloadList } from '@/components/download-list'
import { IocTable, PacketView } from '@/components/evidence'
import { ExerciseCard } from '@/components/exercise-card'
import { Container, PageHeader } from '@/components/page-header'
import { Prose } from '@/components/prose'
import { ProgressiveHints, Spoiler } from '@/components/reveal'
import { exercises, getExercise } from '@/content/exercises'
import { getWalkthrough } from '@/lib/content'
import { resolveDownloads } from '@/lib/downloads'
import { toSummary } from '@/lib/site'
import { formatDate, formatUtc } from '@/lib/utils'

export function generateStaticParams() {
  return exercises.map((e) => ({ slug: e.slug }))
}
export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = getExercise((await params).slug)
  return e ? { title: e.title, description: e.summary } : {}
}

const SECTIONS = [
  ['overview', 'Overview'],
  ['scenario', 'Scenario and background'],
  ['objectives', 'Learning objectives'],
  ['rules', 'Rules of engagement'],
  ['tools', 'Tools and environment'],
  ['evidence', 'Downloadable evidence'],
  ['questions', 'Investigation questions'],
  ['hints', 'Hints'],
  ['walkthrough', 'Walkthrough'],
  ['findings', 'Findings and IOCs'],
  ['answer-key', 'Answer key'],
  ['annotated', 'Annotated evidence'],
  ['remediation', 'Remediation'],
  ['reading', 'Further reading'],
  ['related', 'Related exercises'],
] as const

function Section({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24 border-t border-border pt-8 first:border-t-0 first:pt-0">
      <h2 id={id} className="mb-4 flex items-baseline gap-3 text-xl font-semibold tracking-tight text-white">
        <span className="font-mono text-[12px] text-slate-600">{String(n).padStart(2, '0')}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

export default async function ExercisePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = getExercise(slug)
  if (!e) notFound()
  const walkthrough = await getWalkthrough(slug)
  const files = resolveDownloads(e.downloads)
  const related = e.related.map(getExercise).filter((x): x is NonNullable<typeof x> => Boolean(x))

  return (
    <Container>
      <PageHeader
        crumbs={[{ href: '/exercises', label: 'Exercises' }, { label: e.date }]}
        kicker={`Traffic analysis exercise · ${e.category}`}
        title={e.title}
        description={<p>{e.summary}</p>}
      >
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge value={e.difficulty} />
          <AnswerStatusBadge status={e.answerStatus} />
          {e.beginnerFriendly && <span className="chip border-cyan-400/30 text-cyan-200">Beginner friendly</span>}
          <span className="chip normal-case tracking-normal">
            <Calendar size={11} aria-hidden /> {formatDate(e.date)}
          </span>
          <span className="chip normal-case tracking-normal">
            <Clock size={11} aria-hidden /> ~{e.estimatedMinutes} min
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="#evidence" className="btn-primary btn-sm">
            Get the evidence
          </a>
          <Link href={`/exercises/${e.slug}/answers`} className="btn-secondary btn-sm">
            Full answer report <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0 space-y-10">
          <Section id="overview" n={1} title="Exercise overview">
            <dl className="grid gap-px overflow-hidden rounded-lg border border-border bg-border text-[13.5px] sm:grid-cols-2">
              {[
                ['Category', e.category],
                ['Difficulty', `${e.difficulty} · ~${e.estimatedMinutes} minutes`],
                ['Capture window', `${formatUtc(e.captureWindowUtc.start)} → ${formatUtc(e.captureWindowUtc.end)}`],
                ['Protocols', e.protocols.join(', ')],
              ].map(([k, v]) => (
                <div key={k} className="bg-card p-3">
                  <dt className="lab-kicker">{k}</dt>
                  <dd className="mt-1 text-slate-200">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {e.topics.map((t) => (
                <TopicChip key={t} slug={t} />
              ))}
            </div>
            <p className="mt-4 text-[13px] text-slate-400">
              Capture source:{' '}
              <a href={e.source.href} target="_blank" rel="noopener noreferrer" className="link">
                {e.source.name} <ExternalLink size={11} className="inline" aria-hidden />
              </a>
              . The scenario wording, walkthrough, evidence views, and answer key on this page are original Rivan work reproduced from the
              capture.
            </p>
          </Section>

          <Section id="scenario" n={2} title="Scenario and background">
            <div className="space-y-3 text-[15px] leading-7 text-slate-300">
              {e.scenario.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-border bg-[hsl(222_30%_8.5%)] p-4">
              <p className="lab-kicker mb-2">Alerts</p>
              <ul className="space-y-1 font-mono text-[12.5px] text-amber-100/90">
                {e.alerts.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </Section>

          <Section id="objectives" n={3} title="Learning objectives">
            <ul className="list-disc space-y-1.5 pl-5 text-[14.5px] text-slate-300 marker:text-slate-600">
              {e.objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </Section>

          <Section id="rules" n={4} title="Rules of engagement and safety notes">
            <aside className="callout callout-caution text-slate-300" role="note">
              <p className="callout-title flex items-center gap-2">
                <ShieldAlert size={13} aria-hidden /> Live malware traffic
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Open the capture only inside an isolated analysis VM. Extract the ZIP there, not on your host.</li>
                <li>Do not browse to, ping, or resolve any domain or IP from the capture. Use the defanged forms in notes.</li>
                <li>Files exported from the capture may be live malware. Hash them, never run them, and delete them when done.</li>
                <li>Analysis is passive: no scanning or contacting attacker infrastructure, even out of curiosity.</li>
              </ul>
              <p>
                New here? Set up your lab with the{' '}
                <Link href="/docs/install-vmware" className="link">
                  VMware setup guide
                </Link>{' '}
                and read the{' '}
                <Link href="/safety" className="link">
                  safety rules
                </Link>
                .
              </p>
            </aside>
          </Section>

          <Section id="tools" n={5} title="Required tools and environment">
            <ul className="list-disc space-y-1.5 pl-5 text-[14.5px] text-slate-300 marker:text-slate-600">
              {e.tools.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="lab-kicker mb-2 mt-6">Network environment in the capture</p>
            <dl className="grid gap-px overflow-hidden rounded-lg border border-border bg-border text-[13.5px] sm:grid-cols-2">
              {e.environment.map((x) => (
                <div key={x.label} className="bg-card p-3">
                  <dt className="lab-kicker">{x.label}</dt>
                  <dd className="mt-1 font-mono text-[13px] text-slate-200">{x.value}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="evidence" n={6} title="Downloadable evidence">
            <p className="mb-4 text-[14px] text-slate-400">
              This is the only file you need. See{' '}
              <Link href="/docs/test-your-lab" className="link">
                Test your lab
              </Link>{' '}
              for how to check, unzip, and open it.
            </p>
            <DownloadList items={files} showExercise={false} />
          </Section>

          <Section id="questions" n={7} title="Investigation questions">
            <ol className="space-y-2">
              {e.questions.map((q, i) => (
                <li key={q.id} className="lab-surface flex gap-3 p-3 text-[14.5px] text-slate-200">
                  <span className="font-mono text-[12px] text-cyan-300">Q{i + 1}</span>
                  {q.question}
                </li>
              ))}
            </ol>
          </Section>

          <Section id="hints" n={8} title="Hints">
            <p className="mb-3 text-[14px] text-slate-400">Hints are revealed one at a time, from a gentle nudge to a near answer.</p>
            <ProgressiveHints hints={e.hints} />
          </Section>

          <Section id="walkthrough" n={9} title="Step-by-step investigation walkthrough">
            <Spoiler label="Reveal the walkthrough" warning="Contains the full solution">
              {walkthrough ? <Prose html={walkthrough.html} /> : <p className="text-slate-400">The walkthrough for this exercise has not been published yet.</p>}
            </Spoiler>
          </Section>

          <Section id="findings" n={10} title="Findings and indicators of compromise">
            <Spoiler label="Reveal findings and IOCs" warning="Contains answers">
              <p className="mb-4 text-[14.5px] leading-7 text-slate-300">{e.incidentSummary}</p>
              <IocTable iocs={e.iocs} />
            </Spoiler>
          </Section>

          <Section id="answer-key" n={11} title="Answer key">
            <Spoiler label="Reveal the answer key" warning="Contains answers">
              <AnswerKey exercise={e} />
            </Spoiler>
          </Section>

          <Section id="annotated" n={12} title="Annotated evidence">
            <Spoiler label="Reveal annotated packet views" warning="Contains answers">
              <div className="space-y-6">
                {e.evidenceViews.map((v) => (
                  <PacketView key={v.id} view={v} />
                ))}
                <div>
                  <p className="lab-kicker mb-3">Timeline</p>
                  <Timeline exercise={e} />
                </div>
              </div>
            </Spoiler>
          </Section>

          <Section id="remediation" n={13} title="Remediation recommendations">
            <Spoiler label="Reveal remediation and assessment" warning="Names the affected host and user">
              <Remediation exercise={e} />
              <div className="mt-6">
                <Assessment exercise={e} />
              </div>
            </Spoiler>
          </Section>

          <Section id="reading" n={14} title="Further reading">
            <ul className="space-y-2.5">
              {e.furtherReading.map((r) => (
                <li key={r.href} className="text-[14px]">
                  <a href={r.href} target="_blank" rel="noopener noreferrer" className="link">
                    {r.title} <ExternalLink size={11} className="inline" aria-hidden />
                  </a>
                  <span className="text-slate-400"> — {r.note}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="related" n={15} title="Related exercises">
            <div className="grid gap-5 md:grid-cols-2">
              {related.map((r) => (
                <ExerciseCard key={r.slug} e={toSummary(r)} />
              ))}
            </div>
          </Section>
        </div>

        <aside className="hidden lg:block">
          <nav aria-label="Exercise sections" className="sticky top-20 text-[13px]">
            <p className="lab-kicker mb-3">Sections</p>
            <ol className="space-y-1 border-l border-border">
              {SECTIONS.map(([id, label], i) => (
                <li key={id}>
                  <a href={`#${id}`} className="-ml-px flex gap-2 border-l border-transparent py-0.5 pl-3 text-slate-400 hover:border-cyan-300 hover:text-white">
                    <span className="font-mono text-[11px] text-slate-600">{String(i + 1).padStart(2, '0')}</span>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
            <Link href={`/exercises/${e.slug}/answers`} className="btn-secondary btn-sm mt-6 w-full">
              Full answer report
            </Link>
          </nav>
        </aside>
      </div>
    </Container>
  )
}
