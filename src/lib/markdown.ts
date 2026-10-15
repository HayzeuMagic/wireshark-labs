import 'server-only'

import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { Element, ElementContent, Root as HastRoot } from 'hast'
import { toString as hastToString } from 'hast-util-to-string'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { createHighlighter, type Highlighter } from 'shiki'
import { unified } from 'unified'
import { visit, SKIP } from 'unist-util-visit'
import { wiresharkGrammar } from './wireshark-grammar'

const CONTENT_ROOT = path.join(process.cwd(), 'content')

export interface TocItem {
  id: string
  text: string
  depth: 2 | 3
}

export interface RenderedMarkdown {
  html: string
  toc: TocItem[]
  /** Plain text, used for search snippets and reading time. */
  text: string
}

const LANGS = ['bash', 'shellscript', 'powershell', 'json', 'yaml', 'python', 'csv', 'ini', 'http', 'markdown', 'console'] as const
const LANG_LABELS: Record<string, string> = {
  wireshark: 'Display filter',
  bash: 'Bash',
  shellscript: 'Shell',
  console: 'Terminal',
  powershell: 'PowerShell',
  json: 'JSON',
  yaml: 'YAML',
  python: 'Python',
  csv: 'CSV',
  ini: 'INI',
  http: 'HTTP',
  output: 'Output',
  text: 'Text',
  zeek: 'Zeek',
  suricata: 'Suricata',
  yara: 'YARA',
  markdown: 'Markdown',
}

let highlighterPromise: Promise<Highlighter> | null = null
function getHighlighter() {
  highlighterPromise ??= createHighlighter({ themes: ['github-dark-default'], langs: [...LANGS, wiresharkGrammar] })
  return highlighterPromise
}

function h(tagName: string, properties: Element['properties'], children: ElementContent[] = []): Element {
  return { type: 'element', tagName, properties, children }
}
const text = (value: string): ElementContent => ({ type: 'text', value })

function parseMeta(meta: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!meta) return out
  for (const m of meta.matchAll(/(\w+)="([^"]*)"/g)) out[m[1]] = m[2]
  return out
}

/** Replace fenced code blocks with highlighted, captioned blocks that carry a copy button. */
function rehypeCode(highlighter: Highlighter) {
  const loaded = new Set(highlighter.getLoadedLanguages())
  return () => (tree: HastRoot) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === undefined) return
      const code = node.children[0]
      if (!code || code.type !== 'element' || code.tagName !== 'code') return
      const cls = (code.properties.className as string[] | undefined) ?? []
      const lang = cls.find((c) => c.startsWith('language-'))?.slice(9) ?? 'text'
      const meta = parseMeta((code.data as { meta?: string } | undefined)?.meta)
      const source = hastToString(code).replace(/\n$/, '')
      const isOutput = lang === 'output'
      const highlightLang = loaded.has(lang) ? lang : 'text'

      const highlighted = highlighter.codeToHast(source, { lang: highlightLang, theme: 'github-dark-default' })
      const pre = highlighted.children[0] as Element
      // Shiki emits raw `class`/`tabindex` properties; replace them so the element has one of each.
      delete pre.properties.class
      delete pre.properties.tabindex
      pre.properties.tabIndex = 0
      pre.properties.className = isOutput ? ['shiki-pre', 'is-output'] : ['shiki-pre']

      const header = h('div', { className: ['code-header'] }, [
        h('span', { className: ['code-lang'] }, [text(meta.title ?? LANG_LABELS[lang] ?? lang)]),
        isOutput && meta.source ? h('span', { className: ['code-source'] }, [text(meta.source)]) : text(''),
        h('button', { type: 'button', className: ['copy-btn'], 'data-copy': '', 'aria-label': 'Copy code to clipboard' }, [text('Copy')]),
      ])
      parent.children[index] = h('figure', { className: ['code-block', isOutput ? 'code-output' : ''], 'data-lang': lang }, [header, pre])
      return SKIP
    })
  }
}

const CALLOUTS: Record<string, string> = { NOTE: 'Note', TIP: 'Tip', WARNING: 'Warning', CAUTION: 'Safety', IMPORTANT: 'Important', TROUBLESHOOTING: 'Troubleshooting', EXAMPLE: 'Fictional example' }

/** GitHub-style alerts: > [!WARNING] … */
function rehypeCallouts() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'blockquote') return
      const firstP = node.children.find((c): c is Element => c.type === 'element' && c.tagName === 'p')
      const first = firstP?.children[0]
      if (!firstP || !first || first.type !== 'text') return
      const m = first.value.match(/^\[!(\w+)\]\s*/)
      if (!m || !CALLOUTS[m[1]]) return
      first.value = first.value.slice(m[0].length)
      node.tagName = 'aside'
      node.properties = { className: ['callout', `callout-${m[1].toLowerCase()}`], role: 'note' }
      node.children.unshift(h('p', { className: ['callout-title'] }, [text(CALLOUTS[m[1]])]))
    })
  }
}

/** Heading anchors, figures for standalone images, scrollable tables, safe external links. */
function rehypeStructure(toc: TocItem[]) {
  return () => (tree: HastRoot) => {
    visit(tree, 'element', (node, index, parent) => {
      if ((node.tagName === 'h2' || node.tagName === 'h3') && typeof node.properties.id === 'string') {
        const id = node.properties.id
        toc.push({ id, text: hastToString(node), depth: node.tagName === 'h2' ? 2 : 3 })
        node.children.push(h('a', { href: `#${id}`, className: ['heading-anchor'], 'aria-label': `Link to section: ${hastToString(node)}` }, [text('#')]))
        return
      }
      if (node.tagName === 'table' && parent && index !== undefined) {
        parent.children[index] = h('div', { className: ['table-wrap'], tabIndex: 0, role: 'region', 'aria-label': 'Scrollable table' }, [node])
        return SKIP
      }
      if (node.tagName === 'p' && parent && index !== undefined) {
        const only = node.children.filter((c) => !(c.type === 'text' && !c.value.trim()))
        if (only.length === 1 && only[0].type === 'element' && only[0].tagName === 'img') {
          const img = only[0]
          const caption = img.properties.title as string | undefined
          delete img.properties.title
          img.properties.loading = 'lazy'
          parent.children[index] = h('figure', { className: ['md-figure'] }, caption ? [img, h('figcaption', {}, [text(caption)])] : [img])
          return SKIP
        }
      }
      if (node.tagName === 'a' && typeof node.properties.href === 'string' && /^https?:\/\//.test(node.properties.href)) {
        node.properties.target = '_blank'
        node.properties.rel = ['noopener', 'noreferrer']
        node.properties.className = ['external']
      }
    })
  }
}

export async function renderMarkdown(source: string): Promise<RenderedMarkdown> {
  const highlighter = await getHighlighter()
  const toc: TocItem[] = []
  let plain = ''
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(() => (tree: HastRoot) => {
      plain = hastToString(tree)
    })
    .use(rehypeSlug)
    .use(rehypeCallouts)
    .use(rehypeCode(highlighter))
    .use(rehypeStructure(toc))
    .use(rehypeStringify)
    .process(source)
  return { html: String(file), toc, text: plain }
}

export interface MarkdownFile<T> {
  slug: string
  data: T
  body: string
}

export function readCollection<T>(dir: 'docs' | 'tutorials' | 'exercises'): MarkdownFile<T>[] {
  const abs = path.join(CONTENT_ROOT, dir)
  return readdirSync(abs)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const parsed = matter(readFileSync(path.join(abs, f), 'utf8'))
      return { slug: f.replace(/\.md$/, ''), data: parsed.data as T, body: parsed.content }
    })
}

export function readingMinutes(plain: string): number {
  return Math.max(1, Math.round(plain.split(/\s+/).length / 220))
}
