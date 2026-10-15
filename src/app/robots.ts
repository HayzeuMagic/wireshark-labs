import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    // Evidence archives are for people, not crawlers.
    rules: { userAgent: '*', allow: '/', disallow: '/downloads/files/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
