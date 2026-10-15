import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

export interface Crumb {
  href?: string
  label: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ href: '/', label: 'Home' }, ...items]
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1 font-mono text-[11px] text-slate-500">
        {all.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} aria-hidden className="text-slate-600" />}
            {c.href && i < all.length - 1 ? (
              <Link href={c.href} className="hover:text-cyan-300">
                {c.label}
              </Link>
            ) : (
              <span aria-current={i === all.length - 1 ? 'page' : undefined} className="max-w-[40ch] truncate text-slate-400">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function PageHeader({
  crumbs,
  kicker,
  title,
  description,
  children,
}: {
  crumbs: Crumb[]
  kicker?: string
  title: string
  description?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="mb-10 border-b border-border pb-8">
      <Breadcrumbs items={crumbs} />
      {kicker && <p className="lab-kicker mb-3 text-cyan-300/90">{kicker}</p>}
      <h1 className="max-w-4xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
      {description && <div className="mt-4 max-w-3xl text-[15px] leading-7 text-slate-400">{description}</div>}
      {children && <div className="mt-6">{children}</div>}
    </header>
  )
}

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
}

export function SectionHeading({ id, kicker, title, children }: { id?: string; kicker?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker && <p className="lab-kicker">{kicker}</p>}
        <h2 id={id} className="mt-1 scroll-mt-24 text-xl font-semibold tracking-tight text-white">
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}
