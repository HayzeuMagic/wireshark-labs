import type { DownloadResource } from './types'

/**
 * The downloads library: one password-protected capture per exercise, nothing else.
 *
 * `path` is relative to public/downloads/files. Sizes and SHA-256 checksums are not written
 * here; `npm run downloads:build` calculates them from the real files and writes
 * src/generated/downloads-manifest.json. A download button only appears for files in it.
 */

export const EVIDENCE_ZIP_PASSWORD = 'infected'

const captures: { date: string; exercise: string }[] = [
  { date: '2026-01-31', exercise: '2026-01-31-lumma-stealer-fake-file-share' },
  { date: '2026-02-28', exercise: '2026-02-28-netsupport-rat-heartbeat' },
  { date: '2026-08-09', exercise: '2026-08-09-formbook-xloader-c2-rotation' },
  { date: '2026-09-11', exercise: '2026-09-11-kongtuke-clickfix-chain' },
  { date: '2026-10-01', exercise: '2026-10-01-exe-over-port-9000-and-rat-c2' },
]

export const downloads: DownloadResource[] = captures.map(({ date, exercise }) => {
  const pcap = `${date}-traffic-analysis-exercise.pcap`
  return {
    id: `${date}-pcap`,
    path: `exercises/${date}/${pcap}.zip`,
    title: `${date} exercise capture`,
    exercise,
    password: EVIDENCE_ZIP_PASSWORD,
    inner: { filename: pcap, sourcePath: `${pcap}/${pcap}` },
  }
})

export function getDownload(id: string): DownloadResource | undefined {
  return downloads.find((d) => d.id === id)
}
