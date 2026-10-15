/**
 * Compiles every Wireshark display filter published on the site with tshark, so a typo in
 * documentation or an answer key is caught before readers paste it.
 *
 *   TSHARK=/path/to/tshark npx tsx scripts/check-filters.ts
 *
 * Sources: ```wireshark fenced blocks in content/**.md, and the `proof` and evidence-view
 * filters in src/content/exercises.ts that look like display filters.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { exercises } from '../src/content/exercises'

const ROOT = path.resolve(__dirname, '..')
const TSHARK = [process.env.TSHARK, 'C:\\Program Files\\Wireshark\\tshark.exe', '/usr/bin/tshark', '/usr/local/bin/tshark', '/opt/homebrew/bin/tshark'].find(
  (c) => c && existsSync(c),
) ?? 'tshark'

const filters: { filter: string; where: string }[] = []

for (const dir of ['docs', 'tutorials', 'exercises']) {
  for (const f of readdirSync(path.join(ROOT, 'content', dir))) {
    const text = readFileSync(path.join(ROOT, 'content', dir, f), 'utf8')
    for (const m of text.matchAll(/```wireshark[^\n]*\n([\s\S]*?)```/g)) {
      filters.push({ filter: m[1].trim(), where: `content/${dir}/${f}` })
    }
  }
}

// Answer-key proofs that are plain display filters (not commands or GUI instructions).
const looksLikeFilter = (s: string) => !/^tshark |→|File |  then  /.test(s)
for (const e of exercises) {
  for (const q of e.questions) if (looksLikeFilter(q.proof)) filters.push({ filter: q.proof, where: `${e.slug} question ${q.id}` })
  for (const v of e.evidenceViews) filters.push({ filter: v.filter, where: `${e.slug} view ${v.id}` })
}

let failed = 0
for (const { filter, where } of filters) {
  try {
    // -Y validation needs an input; reading zero packets from the smallest capture is enough.
    execFileSync(TSHARK, ['-r', path.join(ROOT, '2026-02-28-traffic-analysis-exercise.pcap', '2026-02-28-traffic-analysis-exercise.pcap'), '-c', '1', '-Y', filter], {
      stdio: ['ignore', 'ignore', 'pipe'],
    })
  } catch (err) {
    failed++
    const msg = (err as { stderr?: Buffer }).stderr?.toString().trim() ?? String(err)
    console.error(`INVALID  ${where}\n  ${filter}\n  ${msg.split('\n')[0]}`)
  }
}
console.log(`${filters.length - failed}/${filters.length} display filters compiled.`)
process.exit(failed ? 1 : 0)
