import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ExerciseBrowser } from '@/components/exercise-browser'
import { ExerciseCard } from '@/components/exercise-card'
import { Container, PageHeader } from '@/components/page-header'
import { exercisesByDate } from '@/content/exercises'
import { toSummary } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Traffic analysis exercises',
  description: 'Searchable catalog of capture-based malware traffic investigations with verified answers.',
}

export default function ExercisesPage() {
  const summaries = exercisesByDate().map(toSummary)
  return (
    <Container>
      <PageHeader
        crumbs={[{ label: 'Exercises' }]}
        kicker="Exercise directory"
        title="Traffic analysis exercises"
        description={
          <p>
            Each exercise gives you a real packet capture, a SOC-style scenario, and questions to answer. Search and filter below; every
            filter combination has its own shareable URL.
          </p>
        }
      />
      <Suspense
        fallback={
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {summaries.map((e) => (
              <ExerciseCard key={e.slug} e={e} headingLevel="h2" />
            ))}
          </div>
        }
      >
        <ExerciseBrowser exercises={summaries} />
      </Suspense>
    </Container>
  )
}
