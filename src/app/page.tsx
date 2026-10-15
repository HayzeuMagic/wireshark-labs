import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Download, FlaskConical, Monitor } from 'lucide-react'
import { ExerciseCard } from '@/components/exercise-card'
import { Container, SectionHeading } from '@/components/page-header'
import { exercises } from '@/content/exercises'
import { getDocs } from '@/lib/content'
import { toSummary } from '@/lib/site'

const levelOrder = { Beginner: 0, Intermediate: 1, Advanced: 2 } as const

export default function HomePage() {
  const steps = getDocs()
  const ordered = [...exercises].sort((a, b) => levelOrder[a.difficulty] - levelOrder[b.difficulty] || a.estimatedMinutes - b.estimatedMinutes)

  return (
    <Container className="max-w-6xl">
      {/* Hero */}
      <section className="border-b border-border pb-12" aria-labelledby="hero-title">
        <div className="flex items-start gap-5">
          <Image src="/brand/rivan_logo.png" alt="Rivan logo" width={64} height={64} className="hidden rounded-md sm:block" priority />
          <div>
            <h1 id="hero-title" className="font-mono text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Rivan Cybersecurity Lab
            </h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-7 text-slate-400">
              Learn to investigate real malware traffic in Wireshark. Set up a safe lab, open a capture, find the infected computer, and check
              your answers.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/docs/${steps[0].slug}`} className="btn-primary">
                Set up your lab <ArrowRight size={15} aria-hidden />
              </Link>
              <Link href="/exercises" className="btn-secondary">
                Browse exercises
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-12" aria-labelledby="how">
        <SectionHeading id="how" kicker="How it works" title="Three things to do" />
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            { Icon: Monitor, title: 'Set up your lab', text: 'Build an isolated VMware VM with Wireshark. One time, about an hour.', href: '/docs' },
            { Icon: Download, title: 'Download a capture', text: 'One ZIP per exercise. Open it only inside the VM.', href: '/downloads' },
            { Icon: FlaskConical, title: 'Investigate and check', text: 'Answer the questions, then compare with the verified answers.', href: '/exercises' },
          ].map(({ Icon, title, text, href }, i) => (
            <li key={title}>
              <Link href={href} className="lab-surface block h-full p-5 transition-colors hover:border-slate-600">
                <span className="flex items-center gap-2 font-mono text-[11px] text-cyan-300">
                  <Icon size={14} aria-hidden /> {String(i + 1).padStart(2, '0')}
                </span>
                <span className="mt-2 block font-semibold text-white">{title}</span>
                <span className="mt-1 block text-[13.5px] leading-6 text-slate-400">{text}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Guide */}
      <section className="mt-14" aria-labelledby="guide">
        <SectionHeading id="guide" kicker="Lab setup" title="Set up VMware step by step">
          <Link href="/docs" className="btn-ghost btn-sm">
            Full guide <ArrowRight size={14} aria-hidden />
          </Link>
        </SectionHeading>
        <ol className="lab-surface grid divide-y divide-border sm:grid-cols-3 sm:divide-y-0">
          {steps.map((s) => (
            <li key={s.slug} className="sm:border-b sm:border-border sm:[&:nth-last-child(-n+3)]:border-b-0">
              <Link href={`/docs/${s.slug}`} className="flex items-center gap-3 p-4 hover:bg-[hsl(221_24%_13%)]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 font-mono text-[12px] font-bold text-cyan-300">
                  {s.step}
                </span>
                <span className="text-[14px] text-slate-200">{s.title}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Exercises */}
      <section className="mt-14" aria-labelledby="exercises">
        <SectionHeading id="exercises" kicker="Practice" title="Exercises, easiest first">
          <Link href="/exercises" className="btn-ghost btn-sm">
            All exercises <ArrowRight size={14} aria-hidden />
          </Link>
        </SectionHeading>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ordered.map((e) => (
            <ExerciseCard key={e.slug} e={toSummary(e)} />
          ))}
        </div>
      </section>
    </Container>
  )
}
