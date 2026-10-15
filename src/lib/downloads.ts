import manifest from '@/generated/downloads-manifest.json'
import { downloads, getDownload } from '@/content/downloads'
import type { DownloadResource } from '@/content/types'

export interface ResolvedDownload extends DownloadResource {
  href: string
  filename: string
  /** Only present when calculated from the real file by scripts/build-downloads.ts. */
  bytes?: number
  sha256?: string
  innerHash?: { filename: string; bytes: number; sha256: string }
  available: boolean
}

type Manifest = Record<string, { bytes: number; sha256: string; inner: { filename: string; bytes: number; sha256: string } }>
const recorded = manifest as Manifest

function resolve(d: DownloadResource): ResolvedDownload {
  const entry = recorded[d.id]
  return {
    ...d,
    href: `/downloads/files/${d.path}`,
    filename: d.path.split('/').pop() ?? d.path,
    bytes: entry?.bytes,
    sha256: entry?.sha256,
    innerHash: entry?.inner,
    available: Boolean(entry),
  }
}

export function allDownloads(): ResolvedDownload[] {
  return downloads.map(resolve)
}

export function resolveDownloads(ids: string[]): ResolvedDownload[] {
  return ids.map((id) => {
    const d = getDownload(id)
    if (!d) throw new Error(`Unknown download id "${id}"`)
    return resolve(d)
  })
}

export function downloadsForExercise(exercise: string): ResolvedDownload[] {
  return downloads.filter((d) => d.exercise === exercise).map(resolve)
}
