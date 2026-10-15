import type { Metadata } from 'next'
import { Container, PageHeader } from '@/components/page-header'
import { TutorialBrowser } from '@/components/tutorial-browser'
import { getTopic, topics } from '@/content/topics'
import { getTutorials } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Tutorials',
  description: 'Original Rivan write-ups on single network forensics techniques, each tied to a lab exercise.',
}

export default function TutorialsPage() {
  const tutorials = getTutorials()
  const used = new Set(tutorials.flatMap((t) => t.topics))
  return (
    <Container>
      <PageHeader
        crumbs={[{ label: 'Tutorials' }]}
        kicker="Tutorials and research"
        title="Tutorials"
        description={<p>Focused, original write-ups. Each one teaches a single technique against a real lab capture and links to the exercise where you can practice it.</p>}
      />
      <TutorialBrowser
        tutorials={tutorials.map((t) => ({ ...t, topics: t.topics.map((s) => ({ slug: s, name: getTopic(s)?.name ?? s })) }))}
        topics={topics.filter((t) => used.has(t.slug)).map((t) => ({ slug: t.slug, name: t.name }))}
      />
    </Container>
  )
}
