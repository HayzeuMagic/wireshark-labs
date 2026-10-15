/**
 * Builds and verifies the downloads library (one password-protected capture per exercise).
 *
 *   npm run downloads:build            package any missing archives, hash everything, write the manifest
 *   npm run downloads:build -- --force re-package every archive
 *   npm run downloads:verify           re-hash and fail if a file is missing or changed (runs before `npm run build`)
 *
 * src/generated/downloads-manifest.json is the only place the site reads sizes and checksums
 * from, so a value is never shown unless it was calculated from the real file.
 */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { downloads } from '../src/content/downloads'
import { exercises } from '../src/content/exercises'
import { createZip } from './lib/zip'

const ROOT = path.resolve(__dirname, '..')
const FILES_ROOT = path.join(ROOT, 'public', 'downloads', 'files')
const MANIFEST = path.join(ROOT, 'src', 'generated', 'downloads-manifest.json')
const args = new Set(process.argv.slice(2))

export interface ManifestEntry {
  path: string
  bytes: number
  sha256: string
  inner: { filename: string; bytes: number; sha256: string }
}

const sha256 = (buf: Buffer) => createHash('sha256').update(buf).digest('hex')

/** Resolve a registry path and refuse anything that escapes the downloads directory. */
function resolveInside(rel: string): string {
  const abs = path.resolve(FILES_ROOT, rel)
  if (!abs.startsWith(FILES_ROOT + path.sep)) throw new Error(`Path escapes the downloads directory: ${rel}`)
  return abs
}

function packageCapture(d: (typeof downloads)[number], data: Buffer) {
  const exercise = exercises.find((e) => e.slug === d.exercise)
  const readme = [
    `Rivan Cybersecurity Lab - ${exercise?.title ?? d.title}`,
    '',
    'WARNING: this archive contains real malicious network traffic and may contain',
    'transferred malware. Open it only inside an isolated analysis VM. Never run',
    'files exported from the capture.',
    '',
    `Exercise page: /exercises/${d.exercise}`,
    `PCAP SHA-256: ${sha256(data)}`,
    '',
  ].join('\r\n')
  const date = new Date(`${exercise?.date ?? '2026-01-01'}T00:00:00Z`)
  const out = resolveInside(d.path)
  mkdirSync(path.dirname(out), { recursive: true })
  writeFileSync(
    out,
    createZip(
      [
        { name: d.inner.filename, data, date },
        { name: 'README.txt', data: Buffer.from(readme, 'utf8'), date },
      ],
      d.password,
    ),
  )
  console.log(`  packaged ${d.path}`)
}

function main() {
  for (const ex of exercises) for (const id of ex.downloads) if (!downloads.some((d) => d.id === id)) throw new Error(`${ex.slug} references unknown download ${id}`)

  // Raw captures are kept out of the public repository (they are unencrypted malware traffic).
  // Without them, the archives are taken as published and the recorded inner checksums are reused.
  const recorded = existsSync(MANIFEST) ? (JSON.parse(readFileSync(MANIFEST, 'utf8')) as Record<string, ManifestEntry>) : {}
  const manifest: Record<string, ManifestEntry> = {}
  for (const d of downloads) {
    const zipPath = resolveInside(d.path)
    const srcPath = path.join(ROOT, d.inner.sourcePath)
    const src = existsSync(srcPath) ? readFileSync(srcPath) : undefined
    if (src && !args.has('--verify') && (args.has('--force') || !existsSync(zipPath))) packageCapture(d, src)
    if (!existsSync(zipPath)) throw new Error(`Archive missing: ${d.path}. Add the source capture and run npm run downloads:build.`)
    const inner = src ? { filename: d.inner.filename, bytes: src.length, sha256: sha256(src) } : recorded[d.id]?.inner
    if (!inner) throw new Error(`No source capture and no recorded checksum for ${d.id}: ${d.inner.sourcePath}`)
    const zip = readFileSync(zipPath)
    manifest[d.id] = { path: d.path, bytes: zip.length, sha256: sha256(zip), inner }
  }

  if (args.has('--verify')) {
    if (JSON.stringify(recorded) !== JSON.stringify(manifest)) {
      console.error('Downloads do not match the manifest. Run npm run downloads:build.')
      process.exit(1)
    }
    console.log(`Verified ${downloads.length} downloads against the manifest.`)
    return
  }

  mkdirSync(path.dirname(MANIFEST), { recursive: true })
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`Manifest written with ${downloads.length} entries.`)
}

try {
  main()
} catch (err) {
  console.error((err as Error).message)
  process.exit(1)
}
