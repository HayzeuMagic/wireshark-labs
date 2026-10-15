import Image from 'next/image'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { MobileNav, NavLinks } from './nav-links'

export const primaryNav = [
  { href: '/docs', label: 'Lab setup' },
  { href: '/exercises', label: 'Exercises' },
  { href: '/downloads', label: 'Downloads' },
  { href: '/answers', label: 'Answers' },
  { href: '/safety', label: 'Safety' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[hsl(222_32%_7%/0.92)] backdrop-blur supports-[backdrop-filter]:bg-[hsl(222_32%_7%/0.8)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-1.5 focus:text-sm focus:text-primary-foreground">
        Skip to content
      </a>
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Rivan Cybersecurity Lab home">
          <Image src="/brand/rivan_logo.png" alt="" width={28} height={28} className="rounded" priority />
          <span className="font-mono text-[13px] font-bold tracking-tight text-white">
            RIVAN<span className="text-cyan-300">/</span>LAB
          </span>
        </Link>
        <NavLinks items={primaryNav} />
        <div className="ml-auto flex items-center gap-2">
          <Link href="/search" className="btn-ghost btn-sm" aria-label="Search the lab">
            <Search size={15} aria-hidden />
            <span className="hidden sm:inline">Search</span>
          </Link>
          <MobileNav items={primaryNav} />
        </div>
      </div>
    </header>
  )
}
