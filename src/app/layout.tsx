import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { SITE_NAME, SITE_URL } from '@/lib/site'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — network traffic analysis training`, template: `%s · ${SITE_NAME}` },
  description:
    'Rivan Cybersecurity Lab: real malware traffic captures, verified answer keys, Wireshark documentation, and detection content for SOC analysts and incident responders.',
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, type: 'website' },
}

export const viewport: Viewport = {
  themeColor: '#0c111b',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="lab-ambient flex min-h-screen flex-col font-sans">
        <SiteHeader />
        <main id="main" className="flex-1 pt-10">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
