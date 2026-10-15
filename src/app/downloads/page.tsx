import type { Metadata } from 'next'
import Link from 'next/link'
import { DownloadList } from '@/components/download-list'
import { Container, PageHeader } from '@/components/page-header'
import { EVIDENCE_ZIP_PASSWORD } from '@/content/downloads'
import { getExercise } from '@/content/exercises'
import { allDownloads } from '@/lib/downloads'

export const metadata: Metadata = {
  title: 'Downloads',
  description: 'One packet capture per exercise, in a password-protected ZIP.',
}

const levelOrder = { Beginner: 0, Intermediate: 1, Advanced: 2 } as const

export default function DownloadsPage() {
  // Easiest first, so the list doubles as a suggested order.
  const items = allDownloads().sort((a, b) => {
    const ea = getExercise(a.exercise)!
    const eb = getExercise(b.exercise)!
    return levelOrder[ea.difficulty] - levelOrder[eb.difficulty] || ea.estimatedMinutes - eb.estimatedMinutes
  })

  return (
    <Container className="max-w-4xl">
      <PageHeader
        crumbs={[{ label: 'Downloads' }]}
        kicker="Downloads"
        title="Exercise captures"
        description={<p>One file per exercise. Each is a ZIP containing the packet capture. Listed easiest first.</p>}
      />

      <ol className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          ['1', 'Set up your lab first', <>Follow the <Link href="/docs" className="link">setup guide</Link>. Download inside the VM.</>],
          ['2', 'Unzip with the password', <>The password is <code className="font-mono text-amber-200">{EVIDENCE_ZIP_PASSWORD}</code>.</>],
          ['3', 'Open in Wireshark', <>Exact commands are in <Link href="/docs/test-your-lab" className="link">Test your lab</Link>.</>],
        ].map(([n, title, text]) => (
          <li key={n as string} className="lab-surface p-4">
            <p className="font-mono text-[11px] text-cyan-300">{n} / 3</p>
            <p className="mt-1 font-medium text-white">{title}</p>
            <p className="mt-1 text-[13px] text-slate-400">{text}</p>
          </li>
        ))}
      </ol>

      <DownloadList items={items} />
    </Container>
  )
}
