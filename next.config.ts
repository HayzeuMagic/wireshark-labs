import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Content and evidence files are read from disk at build time; keep them out of the tracer.
  outputFileTracingExcludes: { '*': ['./public/downloads/**', './*.pcap/**', './*-answers.pdf/**'] },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // Every file in the downloads library is served as an attachment, never rendered inline.
        source: '/downloads/files/:path*',
        headers: [
          { key: 'Content-Disposition', value: 'attachment' },
          { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
        ],
      },
    ]
  },
}

export default nextConfig
