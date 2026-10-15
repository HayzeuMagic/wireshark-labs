import type { EvidenceView, Ioc } from '@/content/types'
import { defang } from '@/lib/defang'
import { cn, formatUtc } from '@/lib/utils'
import { CopyButton } from './copy-button'

const protoColor: Record<string, string> = {
  HTTP: 'text-emerald-300',
  DNS: 'text-sky-300',
  DHCP: 'text-violet-300',
  NBNS: 'text-violet-300',
  BROWSER: 'text-violet-300',
  KRB5: 'text-amber-200',
  SAMR: 'text-amber-200',
  QUIC: 'text-fuchsia-300',
  TCP: 'text-slate-300',
}

/**
 * An "annotated screenshot" built from real tshark output instead of an image:
 * it stays searchable, copyable, and readable by screen readers.
 */
export function PacketView({ view }: { view: EvidenceView }) {
  const marked = new Map(view.callouts.map((c, i) => [c.no, i + 1]))
  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-[hsl(222_30%_8.5%)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-[hsl(221_24%_12%)] px-3 py-2">
        <span className="lab-kicker text-slate-300">{view.title}</span>
        <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-cyan-200" title={view.filter}>
          {view.filter}
        </code>
        <CopyButton value={view.filter} label="Copy filter" />
      </div>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={`Packet list: ${view.title}`}>
        <table className="w-full min-w-[760px] border-collapse font-mono text-[12px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-[0.12em] text-slate-500">
              <th scope="col" className="w-8 px-2 py-1.5" aria-label="Annotation" />
              <th scope="col" className="px-2 py-1.5">No.</th>
              <th scope="col" className="px-2 py-1.5">Time (UTC)</th>
              <th scope="col" className="px-2 py-1.5">Source</th>
              <th scope="col" className="px-2 py-1.5">Destination</th>
              <th scope="col" className="px-2 py-1.5">Protocol</th>
              <th scope="col" className="px-2 py-1.5">Info</th>
            </tr>
          </thead>
          <tbody>
            {view.rows.map((r) => {
              const n = marked.get(r.no)
              return (
                <tr key={r.no} className={cn('border-t border-border/50', n && 'bg-cyan-400/[0.06]')}>
                  <td className="px-2 py-1.5 text-center">
                    {n && (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-300 text-[10px] font-bold text-slate-950" aria-label={`Annotation ${n}`}>
                        {n}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-slate-400">{r.no}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-400">{r.time}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-200">{r.src}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-200">{r.dst}</td>
                  <td className={cn('px-2 py-1.5 font-semibold', protoColor[r.proto] ?? 'text-cyan-200')}>{r.proto}</td>
                  <td className="px-2 py-1.5 text-slate-300">{r.info}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <figcaption className="space-y-2 border-t border-border px-4 py-3 text-[13px] text-slate-300">
        <ol className="space-y-1.5">
          {view.callouts.map((c, i) => (
            <li key={c.no} className="flex gap-2.5">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-300 font-mono text-[10px] font-bold text-slate-950" aria-hidden>
                {i + 1}
              </span>
              <span>
                <span className="font-mono text-[12px] text-slate-500">Frame {c.no}: </span>
                {c.text}
              </span>
            </li>
          ))}
        </ol>
        <p className="text-[12px] text-slate-500">{view.caption}</p>
      </figcaption>
    </figure>
  )
}

const verdictStyle: Record<Ioc['verdict'], string> = {
  malicious: 'border-red-400/35 text-red-300',
  suspicious: 'border-amber-400/30 text-amber-200',
  'abused-legitimate': 'border-sky-400/30 text-sky-300',
}
const verdictLabel: Record<Ioc['verdict'], string> = {
  malicious: 'Malicious',
  suspicious: 'Suspicious',
  'abused-legitimate': 'Legitimate / abused',
}

export function IocTable({ iocs }: { iocs: Ioc[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border" tabIndex={0} role="region" aria-label="Indicators of compromise">
      <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
        <thead className="bg-[hsl(221_24%_13%)]">
          <tr className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-slate-400">
            <th scope="col" className="px-3 py-2">Type</th>
            <th scope="col" className="px-3 py-2">Indicator (defanged)</th>
            <th scope="col" className="px-3 py-2">Verdict</th>
            <th scope="col" className="px-3 py-2">Role and context</th>
            <th scope="col" className="px-3 py-2">First seen</th>
          </tr>
        </thead>
        <tbody>
          {iocs.map((i) => (
            <tr key={`${i.type}-${i.value}`} className="border-t border-border/60 align-top">
              <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] uppercase text-slate-400">{i.type}</td>
              <td className="max-w-[28rem] px-3 py-2">
                <code className="break-all font-mono text-[12px] text-cyan-200">
                  {defang(i)}
                  {i.port ? `:${i.port}` : ''}
                </code>
              </td>
              <td className="px-3 py-2">
                <span className={cn('chip whitespace-nowrap', verdictStyle[i.verdict])}>{verdictLabel[i.verdict]}</span>
              </td>
              <td className="px-3 py-2 text-slate-300">
                {i.role}
                {i.note && <p className="mt-1 text-[12px] text-slate-500">{i.note}</p>}
              </td>
              <td className="whitespace-nowrap px-3 py-2 font-mono text-[11.5px] text-slate-400">{i.firstSeen ? formatUtc(i.firstSeen) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
