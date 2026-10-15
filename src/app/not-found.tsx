import Link from 'next/link'
import { Container } from '@/components/page-header'

export default function NotFound() {
  return (
    <Container className="max-w-3xl py-16">
      <p className="lab-kicker text-cyan-300/90">Error 404</p>
      <h1 className="mt-2 font-mono text-4xl font-bold text-white">No packets matched this filter.</h1>
      <p className="mt-4 text-[15px] leading-7 text-slate-400">
        The page or file you asked for does not exist. If you followed a download link, the file may have been renamed; the downloads library
        always lists the current files and their checksums.
      </p>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-border bg-[hsl(222_30%_8.5%)] p-4 font-mono text-[13px] text-slate-400">
        <span className="text-cyan-300">http.response.code</span> == <span className="text-amber-200">404</span>
        {'\n'}Displayed: 0 (0.0%)
      </pre>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn-primary">
          Home
        </Link>
        <Link href="/exercises" className="btn-secondary">
          Exercises
        </Link>
        <Link href="/downloads" className="btn-secondary">
          Downloads
        </Link>
        <Link href="/search" className="btn-ghost">
          Search
        </Link>
      </div>
    </Container>
  )
}
