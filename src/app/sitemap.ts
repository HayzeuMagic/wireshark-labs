import type { MetadataRoute } from 'next'
import { exercises } from '@/content/exercises'
import { topics } from '@/content/topics'
import { getDocs, getTutorials } from '@/lib/content'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ['', '/exercises', '/answers', '/docs', '/tutorials', '/archive', '/topics', '/downloads', '/about', '/safety', '/search']
  return [
    ...staticPaths.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...exercises.flatMap((e) => [{ url: `${SITE_URL}/exercises/${e.slug}` }, { url: `${SITE_URL}/exercises/${e.slug}/answers` }]),
    ...getDocs().map((d) => ({ url: `${SITE_URL}/docs/${d.slug}`, lastModified: d.lastReviewed })),
    ...getTutorials().map((t) => ({ url: `${SITE_URL}/tutorials/${t.slug}`, lastModified: t.date })),
    ...topics.map((t) => ({ url: `${SITE_URL}/topics/${t.slug}` })),
  ]
}
