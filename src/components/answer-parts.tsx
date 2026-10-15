import type { Exercise } from '@/content/types'
import { AnswerStatusBadge, answerStatusDescription } from './badges'
import { CopyButton } from './copy-button'

export function AnswerKey({ exercise }: { exercise: Exercise }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <AnswerStatusBadge status={exercise.answerStatus} />
        <p className="text-[12.5px] text-slate-400">
          {answerStatusDescription(exercise.answerStatus)} Verified {exercise.verification.date}. {exercise.verification.method}
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border" tabIndex={0} role="region" aria-label="Answer key">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
          <thead className="bg-[hsl(221_24%_13%)] font-mono text-[10.5px] uppercase tracking-[0.12em] text-slate-400">
            <tr>
              <th scope="col" className="w-10 px-3 py-2">#</th>
              <th scope="col" className="px-3 py-2">Question</th>
              <th scope="col" className="px-3 py-2">Answer</th>
              <th scope="col" className="px-3 py-2">Evidence (filter or command)</th>
            </tr>
          </thead>
          <tbody>
            {exercise.questions.map((q, i) => (
              <tr key={q.id} className="border-t border-border/60 align-top">
                <td className="px-3 py-2.5 font-mono text-[12px] text-slate-500">{i + 1}</td>
                <td className="px-3 py-2.5 text-slate-300">{q.question}</td>
                <td className="px-3 py-2.5 font-medium text-white">
                  <span className="break-words font-mono text-[12.5px] text-emerald-200">{q.answer}</span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-start gap-1">
                    <code className="break-all font-mono text-[12px] text-cyan-200">{q.proof}</code>
                    <CopyButton value={q.proof} label="Copy" className="h-6 shrink-0 px-1.5" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Timeline({ exercise }: { exercise: Exercise }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {exercise.timeline.map((t) => (
        <li key={t.time + t.event} className="relative">
          <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full border border-cyan-300 bg-background" aria-hidden />
          <p className="font-mono text-[12px] text-cyan-300">{t.time} UTC</p>
          <p className="mt-0.5 text-[14px] text-slate-200">{t.event}</p>
          <p className="mt-0.5 font-mono text-[11.5px] text-slate-500">Evidence: {t.evidence}</p>
        </li>
      ))}
    </ol>
  )
}

export function Assessment({ exercise }: { exercise: Exercise }) {
  const level = { High: 'text-emerald-300 border-emerald-400/30', Medium: 'text-amber-200 border-amber-400/30', Low: 'text-red-300 border-red-400/35' }[exercise.confidence.level]
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="lab-surface p-4">
        <p className="lab-kicker mb-2">Root-cause assessment</p>
        <p className="text-[14px] leading-6 text-slate-300">{exercise.rootCause}</p>
      </div>
      <div className="lab-surface p-4">
        <p className="lab-kicker mb-2 flex items-center gap-2">
          Confidence <span className={`chip ${level}`}>{exercise.confidence.level}</span>
        </p>
        <p className="text-[14px] leading-6 text-slate-300">{exercise.confidence.rationale}</p>
      </div>
      <div className="lab-surface p-4 md:col-span-2">
        <p className="lab-kicker mb-2">Limitations</p>
        <ul className="list-disc space-y-1 pl-5 text-[14px] leading-6 text-slate-300 marker:text-slate-600">
          {exercise.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        {exercise.dataNotes.length > 0 && (
          <>
            <p className="lab-kicker mb-2 mt-4">Notes on source data</p>
            <ul className="list-disc space-y-1 pl-5 text-[14px] leading-6 text-slate-300 marker:text-slate-600">
              {exercise.dataNotes.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

export function Remediation({ exercise }: { exercise: Exercise }) {
  return (
    <ol className="list-decimal space-y-2 pl-5 text-[14px] leading-6 text-slate-300 marker:font-mono marker:text-[12px] marker:text-slate-500">
      {exercise.remediation.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ol>
  )
}
