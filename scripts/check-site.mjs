/**
 * End-to-end check against a running server (default http://localhost:3000):
 *
 *   npm run build && npm start   (in another terminal)
 *   npm run check:site           (or: BASE_URL=http://localhost:3100 node scripts/check-site.mjs)
 *
 * - Crawls every page reachable from the sitemap and from internal links.
 * - Fails on any internal link that does not return 200, and on any #fragment
 *   that does not exist as an id on the target page.
 * - Downloads every file in the downloads manifest and compares its size and
 *   SHA-256 with the manifest, and checks it is served as an attachment.
 * - Confirms that a missing page and a missing download return 404.
 */

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const manifest = JSON.parse(readFileSync(path.join(ROOT, 'src/generated/downloads-manifest.json'), 'utf8'))

const problems = []
const pages = new Map() // path -> html
const ids = new Map() // path -> Set(ids)
const links = [] // { from, href }

function attr(html, re) {
  return [...html.matchAll(re)].map((m) => m[1].replace(/&amp;/g, '&'))
}

async function fetchPage(p) {
  const res = await fetch(BASE + p, { redirect: 'manual' })
  if (res.status !== 200) {
    problems.push(`${p}: HTTP ${res.status}`)
    return null
  }
  const html = await res.text()
  pages.set(p, html)
  ids.set(p, new Set(attr(html, /\sid="([^"]+)"/g)))
  return html
}

// 1. Seed from the sitemap.
const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text()
const queue = attr(sitemap, /<loc>([^<]+)<\/loc>/g).map((u) => new URL(u).pathname)
const seen = new Set(queue)

// 2. Crawl.
while (queue.length) {
  const p = queue.shift()
  const html = await fetchPage(p)
  if (!html) continue
  for (const href of attr(html, /<a\s[^>]*href="([^"]+)"/g)) {
    if (/^(https?:|mailto:)/.test(href)) continue
    const url = new URL(href, BASE + p)
    if (url.origin !== BASE) continue
    links.push({ from: p, href: url.pathname + url.hash })
    if (url.pathname.startsWith('/downloads/files/')) continue
    if (!seen.has(url.pathname)) {
      seen.add(url.pathname)
      queue.push(url.pathname)
    }
  }
}
console.log(`Crawled ${pages.size} pages, ${links.length} internal links.`)

// 3. Fragments.
for (const { from, href } of links) {
  const [p, hash] = href.split('#')
  if (!hash || p.startsWith('/downloads/files/')) continue
  const target = p || from
  if (!ids.get(target)?.has(decodeURIComponent(hash))) problems.push(`${from}: link to ${href} has no matching id`)
}

// 4. Downloads: every manifest entry must be linked from a page and served byte-exact.
const entries = Object.values(manifest)
const linkedFiles = new Set(links.filter((l) => l.href.startsWith('/downloads/files/')).map((l) => l.href.slice('/downloads/files/'.length)))
for (const rel of linkedFiles) if (!entries.some((e) => e.path === rel)) problems.push(`Download link to unregistered file: ${rel}`)
for (const e of entries) if (!linkedFiles.has(e.path)) problems.push(`Registered download not linked from any page: ${e.path}`)

let checked = 0
for (const e of entries) {
  const res = await fetch(`${BASE}/downloads/files/${e.path}`)
  if (res.status !== 200) {
    problems.push(`download ${e.path}: HTTP ${res.status}`)
    continue
  }
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length !== e.bytes || createHash('sha256').update(buf).digest('hex') !== e.sha256) problems.push(`download ${e.path}: size or SHA-256 mismatch`)
  const disp = res.headers.get('content-disposition') ?? ''
  if (!disp.startsWith('attachment')) problems.push(`download ${e.path}: not served as attachment (${disp || 'no header'})`)
  checked++
}
console.log(`Verified ${checked} downloads (status, size, SHA-256, Content-Disposition).`)

// 5. 404 handling.
for (const p of ['/this-page-does-not-exist', '/exercises/not-a-real-exercise', '/downloads/files/missing.pcap.zip']) {
  const res = await fetch(BASE + p)
  if (res.status !== 404) problems.push(`${p}: expected 404, got ${res.status}`)
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log('All checks passed.')
