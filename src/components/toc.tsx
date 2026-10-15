import type { TocItem } from '@/lib/markdown'
import { cn } from '@/lib/utils'

export function TableOfContents({ items, title = 'On this page' }: { items: TocItem[]; title?: string }) {
  if (!items.length) return null
  return (
    <nav aria-label={title} className="text-[13px]">
      <p className="lab-kicker mb-3">{title}</p>
      <ol className="space-y-1.5 border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn('-ml-px block border-l border-transparent py-0.5 text-slate-400 hover:border-cyan-300 hover:text-white', item.depth === 2 ? 'pl-3' : 'pl-6 text-[12.5px]')}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
