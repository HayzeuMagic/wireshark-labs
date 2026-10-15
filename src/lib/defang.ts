import type { Ioc } from '@/content/types'

/** Defang the last dot of a host or IP so it cannot be clicked or resolved by accident. */
function defangHost(host: string): string {
  const i = host.lastIndexOf('.')
  return i === -1 ? host : `${host.slice(0, i)}[.]${host.slice(i + 1)}`
}

export function defang(ioc: Pick<Ioc, 'type' | 'value'>): string {
  switch (ioc.type) {
    case 'ipv4':
    case 'domain':
      return defangHost(ioc.value)
    case 'url': {
      const m = ioc.value.match(/^(https?):\/\/([^/:]+)(.*)$/)
      if (!m) return ioc.value
      return `${m[1].replace(/^http/, 'hxxp')}://${defangHost(m[2])}${m[3]}`
    }
    default:
      return ioc.value
  }
}
