import 'server-only'

import { cache } from 'react'
import { exercises } from '@/content/exercises'
import { readCollection, readingMinutes, renderMarkdown } from './markdown'

function isoDate(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v ?? '')
}

// ---- Documentation (a numbered, step-by-step guide) ----------------------------------------

export interface DocMeta {
  slug: string
  step: number
  title: string
  description: string
  /** Rough time to complete the step, in minutes. */
  minutes: number
  lastReviewed: string
  exercises: string[]
  topics: string[]
}

interface DocFrontmatter extends Omit<DocMeta, 'slug' | 'lastReviewed'> {
  lastReviewed: unknown
}

export const getDocs = cache((): DocMeta[] =>
  readCollection<DocFrontmatter>('docs')
    .map(({ slug, data }) => ({
      slug,
      step: data.step,
      title: data.title,
      description: data.description,
      minutes: data.minutes,
      lastReviewed: isoDate(data.lastReviewed),
      exercises: data.exercises ?? [],
      topics: data.topics ?? [],
    }))
    .sort((a, b) => a.step - b.step),
)

export const getDoc = cache(async (slug: string) => {
  const file = readCollection<DocFrontmatter>('docs').find((d) => d.slug === slug)
  const all = getDocs()
  const i = all.findIndex((d) => d.slug === slug)
  if (!file || i === -1) return undefined
  const rendered = await renderMarkdown(file.body)
  return { meta: all[i], ...rendered, prev: all[i - 1], next: all[i + 1], total: all.length }
})

// ---- Tutorials -------------------------------------------------------------------------------

export interface TutorialMeta {
  slug: string
  title: string
  description: string
  date: string
  topics: string[]
  exercises: string[]
  /** Guide steps this tutorial builds on. */
  docs: string[]
  references: { title: string; href: string }[]
}

interface TutorialFrontmatter extends Omit<TutorialMeta, 'slug' | 'date'> {
  date: unknown
}

export const getTutorials = cache((): TutorialMeta[] =>
  readCollection<TutorialFrontmatter>('tutorials')
    .map(({ slug, data }) => ({
      slug,
      title: data.title,
      description: data.description,
      date: isoDate(data.date),
      topics: data.topics ?? [],
      exercises: data.exercises ?? [],
      docs: data.docs ?? [],
      references: data.references ?? [],
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title)),
)

export const getTutorial = cache(async (slug: string) => {
  const file = readCollection<TutorialFrontmatter>('tutorials').find((d) => d.slug === slug)
  const meta = getTutorials().find((d) => d.slug === slug)
  if (!file || !meta) return undefined
  const rendered = await renderMarkdown(file.body)
  return { meta, ...rendered, minutes: readingMinutes(rendered.text) }
})

// ---- Exercise walkthroughs -------------------------------------------------------------------

export const getWalkthrough = cache(async (slug: string) => {
  const file = readCollection<Record<string, never>>('exercises').find((d) => d.slug === slug)
  if (!file) return undefined
  return renderMarkdown(file.body)
})

// ---- Cross-collection helpers ----------------------------------------------------------------

export function contentForTopic(topic: string) {
  return {
    exercises: exercises.filter((e) => e.topics.includes(topic)),
    docs: getDocs().filter((d) => d.topics.includes(topic)),
    tutorials: getTutorials().filter((t) => t.topics.includes(topic)),
  }
}

export interface SearchEntry {
  kind: 'Exercise' | 'Documentation' | 'Tutorial'
  title: string
  description: string
  href: string
  date?: string
  keywords: string
}

export function buildSearchIndex(): SearchEntry[] {
  return [
    ...exercises.map((e) => ({
      kind: 'Exercise' as const,
      title: e.title,
      description: e.summary,
      href: `/exercises/${e.slug}`,
      date: e.date,
      keywords: [e.category, e.difficulty, ...e.topics, ...e.protocols, ...e.iocs.map((i) => i.value)].join(' '),
    })),
    ...getDocs().map((d) => ({
      kind: 'Documentation' as const,
      title: `Step ${d.step}: ${d.title}`,
      description: d.description,
      href: `/docs/${d.slug}`,
      keywords: ['guide', 'step', ...d.topics].join(' '),
    })),
    ...getTutorials().map((t) => ({
      kind: 'Tutorial' as const,
      title: t.title,
      description: t.description,
      href: `/tutorials/${t.slug}`,
      date: t.date,
      keywords: t.topics.join(' '),
    })),
  ]
}
