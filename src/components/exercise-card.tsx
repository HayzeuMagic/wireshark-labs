import Link from 'next/link'
import { ArrowUpRight, Calendar, Clock, FileArchive } from 'lucide-react'
import type { AnswerStatus, Difficulty } from '@/content/types'
import { formatDate } from '@/lib/utils'
import { AnswerStatusBadge, DifficultyBadge } from './badges'

export interface ExerciseSummary {
  slug: string
  title: string
  date: string
  summary: string
  difficulty: Difficulty
  estimatedMinutes: number
  beginnerFriendly: boolean
  category: string
  topics: { slug: string; name: string }[]
  protocols: string[]
  evidenceTypes: string[]
  answerStatus: AnswerStatus
}

export function ExerciseCard({ e, headingLevel = 'h3' }: { e: ExerciseSummary; headingLevel?: 'h2' | 'h3' }) {
  const H = headingLevel
  return (
    <article className="lab-surface group relative flex flex-col p-5 transition-colors duration-150 hover:border-slate-600">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={12} aria-hidden />
          <time dateTime={e.date}>{formatDate(e.date)}</time>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} aria-hidden />~{e.estimatedMinutes} min
        </span>
        <span className="text-slate-500">{e.category}</span>
      </div>
      <H className="text-[17px] font-semibold leading-snug text-white">
        <Link href={`/exercises/${e.slug}`} className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none group-focus-within:text-cyan-200">
          {e.title}
        </Link>
      </H>
      <p className="mt-2 text-[13.5px] leading-6 text-slate-400">{e.summary}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <DifficultyBadge value={e.difficulty} />
        <AnswerStatusBadge status={e.answerStatus} />
        {e.beginnerFriendly && <span className="chip border-cyan-400/30 text-cyan-200">Beginner friendly</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {e.topics.slice(0, 4).map((t) => (
          <span key={t.slug} className="chip normal-case tracking-normal">
            {t.name}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-[12px] text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <FileArchive size={13} aria-hidden />
          {e.evidenceTypes.join(' · ')}
        </span>
        <ArrowUpRight size={15} aria-hidden className="shrink-0 text-slate-500 transition-colors group-hover:text-cyan-300" />
      </div>
    </article>
  )
}
