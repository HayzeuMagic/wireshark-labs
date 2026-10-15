import Link from 'next/link'
import { Download, FileWarning, KeyRound, ShieldAlert } from 'lucide-react'
import { getExercise } from '@/content/exercises'
import type { ResolvedDownload } from '@/lib/downloads'
import { formatBytes } from '@/lib/utils'
import { DifficultyBadge } from './badges'
import { CopyButton } from './copy-button'

function Hash({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <dt className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="min-w-0 break-all font-mono text-[11.5px] text-slate-400">{value}</dd>
      <CopyButton value={value} label="Copy" className="h-6 px-1.5" />
    </div>
  )
}

export function DownloadItem({ d, showExercise = true }: { d: ResolvedDownload; showExercise?: boolean }) {
  const exercise = getExercise(d.exercise)
  return (
    <li className="lab-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {showExercise && exercise ? (
            <>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <DifficultyBadge value={exercise.difficulty} />
                <span className="font-mono text-[11px] text-slate-500">{exercise.date}</span>
              </div>
              <Link href={`/exercises/${exercise.slug}`} className="font-medium text-white hover:text-cyan-300">
                {exercise.title}
              </Link>
              <p className="mt-0.5 break-all font-mono text-[12px] text-slate-400">{d.filename}</p>
            </>
          ) : (
            <p className="break-all font-mono text-sm font-semibold text-white">{d.filename}</p>
          )}
        </div>
        {d.available ? (
          <a href={d.href} download={d.filename} className="btn-primary btn-sm shrink-0" aria-label={`Download ${d.filename}${d.bytes ? `, ${formatBytes(d.bytes)}` : ''}`}>
            <Download size={14} aria-hidden /> Download{d.bytes ? ` · ${formatBytes(d.bytes)}` : ''}
          </a>
        ) : (
          <span className="btn-secondary btn-sm shrink-0 cursor-not-allowed" aria-disabled="true" title="This file has not been published yet.">
            <FileWarning size={14} aria-hidden /> Unavailable
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
        <span className="inline-flex items-center gap-1.5 text-red-300">
          <ShieldAlert size={14} aria-hidden /> Live malware traffic
        </span>
        <span className="inline-flex items-center gap-1.5 text-amber-200">
          <KeyRound size={14} aria-hidden /> Password: <code className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 font-mono">{d.password}</code>
        </span>
      </div>

      {(d.sha256 || d.innerHash) && (
        <details className="mt-3 text-[12.5px]">
          <summary className="text-slate-400 hover:text-slate-200">Checksums (SHA-256)</summary>
          <dl className="mt-2 space-y-1.5">
            {d.sha256 && <Hash label="ZIP file" value={d.sha256} />}
            {d.innerHash && <Hash label="PCAP inside" value={d.innerHash.sha256} />}
          </dl>
        </details>
      )}
    </li>
  )
}

export function DownloadList({ items, showExercise }: { items: ResolvedDownload[]; showExercise?: boolean }) {
  return (
    <ul className="grid gap-3">
      {items.map((d) => (
        <DownloadItem key={d.id} d={d} showExercise={showExercise} />
      ))}
    </ul>
  )
}
