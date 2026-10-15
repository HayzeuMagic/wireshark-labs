# Rivan Cybersecurity Lab

Network traffic analysis training: real malware captures, verified answer reports, documentation, tutorials, and a checksummed downloads library. Built with Next.js 15 (App Router, fully static), React 19, Tailwind CSS 3, and Shiki. Visual identity follows the Rivan Hacker Lab design system.

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # verifies every download against the manifest first (prebuild)
npm start
```

Node 22.2+ is required (the ZIP builder uses `zlib.crc32`).

## Project layout

| Path | Contents |
| --- | --- |
| `src/app/` | Routes: `/`, `/docs` (step-by-step guide), `/exercises`, `/exercises/[slug]`, `/exercises/[slug]/answers`, `/answers`, `/downloads`, `/tutorials`, `/archive`, `/topics`, `/search`, `/about`, `/safety`, 404 |
| `content/docs/*.md` | The lab guide. Each file is one step; front matter `step` sets the order |
| `content/tutorials/*.md` | Tutorials |
| `content/exercises/<slug>.md` | Walkthrough for each exercise |
| `src/content/exercises.ts` | Exercise data: questions, answers, evidence, IOCs. Every value reproduced from the PCAP with tshark |
| `src/content/downloads.ts` | Download registry: one password-protected capture per exercise |
| `src/generated/downloads-manifest.json` | Sizes and SHA-256s calculated from the real files |
| `*.pcap/` | Source captures, packaged into ZIPs by the builder |
| `*-answers.pdf/` | Third-party answer PDFs: reference only, git-ignored, never published |

## Downloads

`npm run downloads:build` packages each capture as a ZIP (ZipCrypto, password `infected`, deterministic output) and writes the manifest. Add `-- --force` to repackage. `npm run downloads:verify` runs before every `npm run build` and fails the build if any archive is missing or changed.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run check:filters   # compiles every published Wireshark display filter with tshark
npm run check:site      # against a running server: crawls all pages, checks every link
                        # and #anchor, downloads every file and verifies SHA-256 + headers
```

## Adding an exercise

Add the capture folder, add it to `src/content/downloads.ts`, add an entry to `src/content/exercises.ts`, and add a walkthrough at `content/exercises/<slug>.md`. Then run `downloads:build` and `check:filters`. Mark answers `verified` only after you have reproduced them from the capture. Otherwise use `awaiting-validation` (the answer page stays unpublished) or `illustrative` (for fictional teaching data).

## Deployment

The site is fully static apart from the Next.js server for headers. The five archives total about 122 MB, so check your host's limits on static file size. For object storage, upload the archives and change the `href` built in `src/lib/downloads.ts`; the checksums stay valid.

Set `NEXT_PUBLIC_SITE_URL` for correct sitemap and Open Graph URLs.
