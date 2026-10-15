import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { Container, PageHeader } from '@/components/page-header'
import { getDocs } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Lab setup guide',
  description: 'Set up an isolated VMware lab with Ubuntu and Wireshark, step by step.',
}

export default function DocsIndexPage() {
  const steps = getDocs()
  const total = steps.reduce((n, s) => n + s.minutes, 0)
  return (
    <Container className="max-w-3xl">
      <PageHeader
        crumbs={[{ label: 'Lab setup' }]}
        kicker="Lab setup guide"
        title="Set up your lab in VMware"
        description={
          <p>
            Build a safe, isolated virtual machine for the exercises. Go in order; each step ends with a check so you know it worked. About {total} minutes in total.
          </p>
        }
      >
        <Link href={`/docs/${steps[0].slug}`} className="btn-primary">
          Start with Step 1 <ArrowRight size={15} aria-hidden />
        </Link>
      </PageHeader>

      <ol className="relative space-y-3">
        {steps.map((s) => (
          <li key={s.slug}>
            <Link href={`/docs/${s.slug}`} className="lab-surface group flex gap-4 p-4 transition-colors hover:border-slate-600 sm:p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 font-mono text-sm font-bold text-cyan-300">
                {s.step}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-semibold text-white group-hover:text-cyan-200">{s.title}</span>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
                    <Clock size={11} aria-hidden /> {s.minutes} min
                  </span>
                </span>
                <span className="mt-1 block text-[13.5px] leading-6 text-slate-400">{s.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Container>
  )
}
