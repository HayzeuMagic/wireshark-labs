import Link from 'next/link'
import { CircleCheck, CircleDashed, FlaskConical } from 'lucide-react'
import { getTopic } from '@/content/topics'
import type { AnswerStatus, Difficulty } from '@/content/types'
import { cn } from '@/lib/utils'

const difficultyStyle: Record<Difficulty, string> = {
  Beginner: 'border-emerald-400/30 text-emerald-300',
  Intermediate: 'border-amber-400/30 text-amber-200',
  Advanced: 'border-red-400/35 text-red-300',
}

export function DifficultyBadge({ value }: { value: Difficulty }) {
  return <span className={cn('chip', difficultyStyle[value])}>{value}</span>
}

const statusInfo: Record<AnswerStatus, { label: string; className: string; Icon: typeof CircleCheck; title: string }> = {
  verified: {
    label: 'Verified answer',
    className: 'border-emerald-400/30 text-emerald-300',
    Icon: CircleCheck,
    title: 'Every answer was reproduced by Rivan from the published evidence file.',
  },
  illustrative: {
    label: 'Illustrative example',
    className: 'border-violet-400/30 text-violet-300',
    Icon: FlaskConical,
    title: 'A fictional teaching example. Values are not findings from a real capture.',
  },
  'awaiting-validation': {
    label: 'Awaiting validation',
    className: 'border-amber-400/30 text-amber-200',
    Icon: CircleDashed,
    title: 'Not yet reproduced from evidence. Do not rely on these answers.',
  },
}

export function AnswerStatusBadge({ status }: { status: AnswerStatus }) {
  const s = statusInfo[status]
  return (
    <span className={cn('chip', s.className)} title={s.title}>
      <s.Icon size={11} aria-hidden />
      {s.label}
    </span>
  )
}

export function answerStatusDescription(status: AnswerStatus) {
  return statusInfo[status].title
}

export function TopicChip({ slug }: { slug: string }) {
  const t = getTopic(slug)
  if (!t) return null
  return (
    <Link href={`/topics/${slug}`} className="chip normal-case tracking-normal hover:border-slate-500 hover:text-white">
      {t.name}
    </Link>
  )
}
