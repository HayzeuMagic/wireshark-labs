import type { Metadata } from 'next'
import Link from 'next/link'
import { AnswerStatusBadge, DifficultyBadge } from '@/components/badges'
import { Container, PageHeader } from '@/components/page-header'
import { exercisesByDate } from '@/content/exercises'
import type { AnswerStatus } from '@/content/types'

export const metadata: Metadata = {
  title: 'Answers and walkthroughs',
  description: 'Index of verified answer reports for every Rivan traffic analysis exercise.',
}

const legend: { status: AnswerStatus; text: string }[] = [
  { status: 'verified', text: 'Rivan reproduced every answer from the published capture. Frame numbers and filters are given so you can check.' },
  { status: 'illustrative', text: 'A fictional teaching example with invented values. Never presented as findings from a real capture.' },
  { status: 'awaiting-validation', text: 'Written but not yet reproduced from evidence. Not published until verified.' },
]

export default function AnswersIndexPage() {
  const list = exercisesByDate()
  return (
    <Container>
      <PageHeader
        crumbs={[{ label: 'Answers' }]}
        kicker="Solutions"
        title="Answers and walkthroughs"
        description={<p>Every exercise has a full answer report: methodology, evidence for each conclusion, indicators, timeline, confidence, and remediation. Reports open behind a spoiler gate.</p>}
      />

      <section aria-labelledby="legend" className="mb-10">
        <h2 id="legend" className="lab-kicker mb-3">
          Answer status labels
        </h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {legend.map((l) => (
            <li key={l.status} className="lab-surface p-4">
              <AnswerStatusBadge status={l.status} />
              <p className="mt-2 text-[13px] leading-6 text-slate-400">{l.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="overflow-x-auto rounded-lg border border-border" tabIndex={0} role="region" aria-label="Answer reports">
        <table className="w-full min-w-[720px] border-collapse text-left text-[14px]">
          <thead className="bg-[hsl(221_24%_13%)] font-mono text-[10.5px] uppercase tracking-[0.12em] text-slate-400">
            <tr>
              <th scope="col" className="px-4 py-2.5">Date</th>
              <th scope="col" className="px-4 py-2.5">Exercise</th>
              <th scope="col" className="px-4 py-2.5">Level</th>
              <th scope="col" className="px-4 py-2.5">Status</th>
              <th scope="col" className="px-4 py-2.5">Links</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.slug} className="border-t border-border/60 align-top">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] text-slate-400">{e.date}</td>
                <td className="px-4 py-3">
                  <Link href={`/exercises/${e.slug}/answers`} className="font-medium text-slate-100 hover:text-cyan-300">
                    {e.title}
                  </Link>
                  <p className="mt-0.5 text-[12.5px] text-slate-500">
                    {e.category} · {e.questions.length} questions · {e.iocs.length} indicators
                  </p>
                </td>
                <td className="px-4 py-3">
                  <DifficultyBadge value={e.difficulty} />
                </td>
                <td className="px-4 py-3">
                  <AnswerStatusBadge status={e.answerStatus} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                  <Link href={`/exercises/${e.slug}/answers`} className="link">
                    Answer report
                  </Link>
                  <span className="text-slate-600"> · </span>
                  <Link href={`/exercises/${e.slug}`} className="link">
                    Exercise
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  )
}
