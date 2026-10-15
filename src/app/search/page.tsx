import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Container, PageHeader } from '@/components/page-header'
import { SiteSearch } from '@/components/site-search'
import { buildSearchIndex } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search Rivan exercises, documentation, and tutorials.',
}

export default function SearchPage() {
  const index = buildSearchIndex()
  return (
    <Container className="max-w-4xl">
      <PageHeader crumbs={[{ label: 'Search' }]} kicker="Search" title="Search the lab" />
      <Suspense fallback={<p className="text-slate-400">Loading search…</p>}>
        <SiteSearch index={index} />
      </Suspense>
    </Container>
  )
}
