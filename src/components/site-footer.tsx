import Image from 'next/image'
import Link from 'next/link'

const columns = [
  {
    title: 'Start',
    links: [
      { href: '/docs', label: 'Lab setup guide' },
      { href: '/docs/install-vmware', label: 'Step 1: Install VMware' },
      { href: '/safety', label: 'Safety rules' },
    ],
  },
  {
    title: 'Practice',
    links: [
      { href: '/exercises', label: 'Exercises' },
      { href: '/downloads', label: 'Downloads' },
      { href: '/answers', label: 'Answers' },
    ],
  },
  {
    title: 'More',
    links: [
      { href: '/tutorials', label: 'Tutorials' },
      { href: '/archive', label: 'Archive' },
      { href: '/about', label: 'About' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-[hsl(222_34%_6%)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/brand/rivan_logo.png" alt="Rivan logo" width={36} height={36} className="rounded" />
            <div>
              <p className="font-mono text-sm font-bold text-white">Rivan Cybersecurity Lab</p>
              <p className="text-xs text-slate-400">Network forensics training</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-[13px] leading-6 text-slate-400">
            Owned and operated by Rivan. Captures in the exercise library are credited to their original publishers on each
            exercise page; walkthroughs, documentation, and tooling are original Rivan work.
          </p>
          <p className="mt-3 max-w-sm text-[13px] leading-6 text-amber-200/80">
            Captures contain live malware traffic. Analyze them only in an isolated environment.{' '}
            <Link href="/safety" className="link">
              Read the safety guide
            </Link>
            .
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="lab-kicker mb-3">{col.title}</p>
            <ul className="space-y-2 text-[13px]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-300 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 font-mono text-[11px] text-slate-500 sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Rivan. All rights reserved.</span>
          <span>For education and authorized defensive work only.</span>
        </div>
      </div>
    </footer>
  )
}
