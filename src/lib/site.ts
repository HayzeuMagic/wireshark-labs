import type { ExerciseSummary } from '@/components/exercise-card'
import { getTopic } from '@/content/topics'
import type { Exercise } from '@/content/types'

export const SITE_NAME = 'Rivan Cybersecurity Lab'
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export function toSummary(e: Exercise): ExerciseSummary {
  return {
    slug: e.slug,
    title: e.title,
    date: e.date,
    summary: e.summary,
    difficulty: e.difficulty,
    estimatedMinutes: e.estimatedMinutes,
    beginnerFriendly: e.beginnerFriendly,
    category: e.category,
    topics: e.topics.map((slug) => ({ slug, name: getTopic(slug)?.name ?? slug })),
    protocols: e.protocols,
    evidenceTypes: e.evidenceTypes,
    answerStatus: e.answerStatus,
  }
}
