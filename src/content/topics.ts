import type { Topic } from './types'

export const topics: Topic[] = [
  {
    slug: 'infected-host-identification',
    name: 'Infected host identification',
    description: 'Recovering IP, MAC, host name, account name, and full name of a Windows client from DHCP, NBNS, Kerberos, and SAMR traffic.',
  },
  {
    slug: 'information-stealers',
    name: 'Information stealers',
    description: 'Traffic from credential- and data-theft malware such as Lumma Stealer and FormBook/XLoader.',
  },
  {
    slug: 'remote-access-trojans',
    name: 'Remote access trojans',
    description: 'Long-lived command-and-control sessions from remote administration tools and RATs.',
  },
  {
    slug: 'c2-beaconing',
    name: 'C2 beaconing',
    description: 'Measuring check-in intervals, request patterns, and session duration to recognize command-and-control.',
  },
  {
    slug: 'dns-analysis',
    name: 'DNS analysis',
    description: 'Using DNS queries and responses to attribute connections, spot suspicious domains, and build timelines.',
  },
  {
    slug: 'http-analysis',
    name: 'HTTP analysis',
    description: 'Reading cleartext HTTP requests, responses, headers, and transferred objects.',
  },
  {
    slug: 'tls-analysis',
    name: 'TLS and encrypted traffic',
    description: 'What remains visible in encrypted sessions: SNI, certificates, versions, QUIC, and Encrypted Client Hello.',
  },
  {
    slug: 'active-directory',
    name: 'Active Directory artifacts',
    description: 'Kerberos, LDAP, SMB, and SAMR traffic that reveals domain, user, and host details.',
  },
  {
    slug: 'file-extraction',
    name: 'File extraction and hashing',
    description: 'Carving transferred files from captures, identifying file types, and hashing them safely.',
  },
  {
    slug: 'social-engineering',
    name: 'Social engineering delivery',
    description: 'Fake verification pages, ClickFix, file-share lures, and other user-driven infection chains.',
  },
  {
    slug: 'incident-reporting',
    name: 'Incident reporting',
    description: 'Turning packet evidence into a clear report with indicators, timelines, confidence, and remediation.',
  },
  {
    slug: 'detection-engineering',
    name: 'Detection engineering',
    description: 'Writing and testing Suricata, Zeek, Sigma, and YARA content from observed behavior.',
  },
  {
    slug: 'wireshark',
    name: 'Wireshark and tshark',
    description: 'Interface, display filters, columns, statistics, and command-line workflows.',
  },
  {
    slug: 'network-security-monitoring',
    name: 'Network security monitoring',
    description: 'Zeek, Suricata, and NetworkMiner workflows that complement packet-level analysis.',
  },
  {
    slug: 'digital-forensics',
    name: 'Digital forensics',
    description: 'Evidence handling, integrity, chain of custody, and repeatable forensic methodology.',
  },
]

export function getTopic(slug: string): Topic | undefined {
  return topics.find((t) => t.slug === slug)
}
