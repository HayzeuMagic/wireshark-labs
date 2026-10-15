'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type Item = { href: string; label: string }

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function NavLinks({ items }: { items: Item[] }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Primary" className="hidden lg:block">
      <ul className="flex items-center gap-0.5">
        {items.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                  active ? 'bg-secondary text-white' : 'text-slate-400 hover:bg-secondary/60 hover:text-slate-100',
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function MobileNav({ items }: { items: Item[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="btn-ghost btn-sm"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={16} aria-hidden /> : <Menu size={16} aria-hidden />}
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
      </button>
      {open && (
        <nav id="mobile-nav" aria-label="Primary" className="absolute inset-x-0 top-14 border-b border-border bg-[hsl(222_32%_8%)] px-4 py-3 shadow-xl">
          <ul className="grid gap-1">
            {[...items, { href: '/tutorials', label: 'Tutorials' }, { href: '/about', label: 'About' }].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                  className={cn(
                    'block rounded-md px-3 py-2.5 text-sm',
                    isActive(pathname, item.href) ? 'bg-secondary text-white' : 'text-slate-300 hover:bg-secondary/60',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
