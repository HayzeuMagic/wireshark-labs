import type { Exercise } from './types'

/**
 * Exercise catalog.
 *
 * Every answer, indicator, frame number, and timestamp in this file was reproduced by Rivan
 * from the published PCAP with tshark 4.4.6 on 2026-10-15. Capture times are UTC.
 * Walkthrough prose lives in content/exercises/<slug>.md.
 */

const SOURCE_NAME = 'malware-traffic-analysis.net'
const verification = {
  date: '2026-10-15',
  method: 'Reproduced from the published PCAP with tshark 4.4.6; file hashes calculated from objects exported with --export-objects.',
}

const commonTools = [
  'Wireshark 4.x (GUI) or tshark 4.x (CLI)',
  'An isolated analysis VM with no access to production networks',
  'A ZIP tool that supports password-protected archives (7-Zip, unzip, Windows Explorer)',
]

const hostIdObjectives = [
  'Identify the internal IP address of the Windows client involved in the alert.',
  'Recover the MAC address and host name from DHCP and NetBIOS traffic.',
  'Recover the Windows account name from Kerberos and the full name from SAMR.',
]

export const exercises: Exercise[] = [
  // ---------------------------------------------------------------------------------------------
  {
    slug: '2026-01-31-lumma-stealer-fake-file-share',
    title: 'Lumma Stealer check-in after a fake file-share download',
    date: '2026-01-31',
    summary:
      'A browser session moves from Google Drive to look-alike file-hosting sites, pulls a 16 MB file over Encrypted Client Hello, and minutes later the host fingerprints itself to a Lumma Stealer server over plain HTTP.',
    scenario: [
      'You are on the SOC queue reviewing last week\'s alerts. One signature hit stands out: Lumma Stealer victim fingerprinting activity on traffic to 153.92.1[.]49 over TCP port 80, on 2026-01-27 at about 23:05 UTC.',
      'You pull a ten-minute packet capture for the internal host that triggered the alert. Incident responders need enough detail to find the machine and the person using it.',
    ],
    alerts: ['2026-01-27 23:05 UTC — ET MALWARE Lumma Stealer Victim Fingerprinting Activity — 153.92.1[.]49:80'],
    difficulty: 'Beginner',
    estimatedMinutes: 45,
    beginnerFriendly: true,
    category: 'Information stealer',
    topics: ['infected-host-identification', 'information-stealers', 'tls-analysis', 'dns-analysis', 'active-directory', 'wireshark'],
    protocols: ['DHCP', 'NBNS', 'Kerberos', 'SAMR', 'DNS', 'TLS', 'HTTP'],
    evidenceTypes: ['PCAP'],
    captureWindowUtc: { start: '2026-01-27T23:04:03Z', end: '2026-01-27T23:14:27Z' },
    environment: [
      { label: 'Client and DC subnet', value: '10.1.21.0/24' },
      { label: 'Active Directory realm', value: 'WIN11OFFICE.COM' },
      { label: 'Domain controller', value: '10.1.21.2' },
      { label: 'Packets / duration', value: '51,115 packets over 624 seconds' },
    ],
    objectives: [
      ...hostIdObjectives,
      'Attribute an Encrypted Client Hello session to a domain by using DNS.',
      'Reconstruct the delivery-to-check-in sequence from DNS, SNI, and HTTP.',
    ],
    tools: commonTools,
    questions: [
      { id: 'ip', question: 'What is the IP address of the infected Windows client?', answer: '10.1.21.58', proof: 'ip.addr == 153.92.1.49' },
      { id: 'mac', question: 'What is the MAC address of the infected Windows client?', answer: '00:21:5d:c8:0e:f2', proof: 'dhcp.option.hostname' },
      { id: 'host', question: 'What is the host name of the infected Windows client?', answer: 'DESKTOP-ES9F3ML', proof: 'nbns && ip.src == 10.1.21.58' },
      { id: 'user', question: 'What is the Windows user account name?', answer: 'gwyatt', proof: 'kerberos.CNameString && !(kerberos.CNameString contains "$")' },
      { id: 'name', question: 'What is the full name of the user?', answer: 'Gabriel Wyatt', proof: 'samr.samr_UserInfo21.full_name' },
      { id: 'c2', question: 'Which domain on 153.92.1[.]49 triggered the Lumma Stealer alert?', answer: 'whitepepper[.]su', proof: 'http.host == "whitepepper.su"' },
      {
        id: 'delivery',
        question: 'Which domain delivered the large (about 16 MB) download shortly before the check-in?',
        answer: 'arch.filemegahab4[.]sbs (104.21.46[.]67)',
        proof: 'dns.qry.name == "arch.filemegahab4.sbs"  then  ip.addr == 104.21.46.67',
      },
      {
        id: 'followup',
        question: 'Which two .cc domains did the host contact within a minute after the check-in?',
        answer: 'holiday-forever[.]cc and communicationfirewall-security[.]cc',
        proof: 'tls.handshake.extensions_server_name contains ".cc"',
      },
    ],
    hints: [
      'The alert gives you an external IP. Any internal address talking to it is your starting point. Statistics → Conversations → IPv4 works well.',
      'DHCP requests and NBNS registrations both carry the host name, and the Ethernet header of the same frames carries the MAC address.',
      'Kerberos AS-REQ messages include the client principal name. Filter on kerberos.CNameString and ignore names ending in $ (those are machine accounts).',
      'Domain-joined Windows clients ask the DC for user details over SAMR. Look for samr.samr_UserInfo21.full_name.',
      'One TLS session has an SNI of cloudflare-ech.com. That is Encrypted Client Hello hiding the real name. Find the DNS answer that resolved to the same server IP a moment earlier.',
    ],
    evidenceViews: [
      {
        id: 'identity',
        title: 'Host and user identity',
        filter: 'dhcp || (nbns && ip.src == 10.1.21.58) || kerberos.CNameString == "gwyatt" || samr.samr_UserInfo21.full_name',
        rows: [
          { no: 3, time: '23:04:03.921', src: '0.0.0.0', dst: '255.255.255.255', proto: 'DHCP', info: 'DHCP Request - Transaction ID 0xa1a63cfb' },
          { no: 42, time: '23:04:05.718', src: '10.1.21.58', dst: '10.1.21.255', proto: 'NBNS', info: 'Registration NB DESKTOP-ES9F3ML<20>' },
          { no: 214, time: '23:04:24.099', src: '10.1.21.58', dst: '10.1.21.2', proto: 'KRB5', info: 'AS-REQ' },
          { no: 358, time: '23:04:24.279', src: '10.1.21.2', dst: '10.1.21.58', proto: 'SAMR', info: 'QueryUserInfo response' },
        ],
        callouts: [
          { no: 3, text: 'Option 12 (Host Name) = DESKTOP-ES9F3ML; Ethernet source 00:21:5d:c8:0e:f2.' },
          { no: 214, text: 'CNameString = gwyatt, realm WIN11OFFICE.' },
          { no: 358, text: 'UserInfo21 Full Name = Gabriel Wyatt.' },
        ],
        caption: 'Rendered from tshark output. Times are UTC on 2026-01-27.',
      },
      {
        id: 'chain',
        title: 'Download, check-in, and follow-up traffic',
        filter: 'frame.number in {2774, 2789, 23675, 24500, 24601, 27839, 28013}',
        rows: [
          { no: 2774, time: '23:04:52.273', src: '10.1.21.2', dst: '10.1.21.58', proto: 'DNS', info: 'Standard query response A arch.filemegahab4.sbs A 104.21.46.67 A 172.67.136.13' },
          { no: 2789, time: '23:04:52.308', src: '10.1.21.58', dst: '104.21.46.67', proto: 'TLSv1.2', info: 'Client Hello (SNI=cloudflare-ech.com)' },
          { no: 23675, time: '23:05:34.457', src: '10.1.21.58', dst: '62.72.32.156', proto: 'TLSv1.2', info: 'Client Hello (SNI=whooptm.cyou)' },
          { no: 24500, time: '23:05:39.253', src: '10.1.21.58', dst: '153.92.1.49', proto: 'HTTP', info: 'GET /api/set_agent?id=3BF67EC05320C5729578BE4C0ADF174C&token=842e…&agent=Chrome' },
          { no: 24601, time: '23:05:40.196', src: '10.1.21.58', dst: '153.92.1.49', proto: 'HTTP', info: 'POST /api/set_agent?id=3BF67EC0…&agent=Chrome&act=log' },
          { no: 27839, time: '23:06:06.915', src: '10.1.21.58', dst: '80.97.160.24', proto: 'TLSv1', info: 'Client Hello (SNI=holiday-forever.cc)' },
          { no: 28013, time: '23:06:10.491', src: '10.1.21.58', dst: '104.21.9.36', proto: 'TLSv1', info: 'Client Hello (SNI=communicationfirewall-security.cc)' },
        ],
        callouts: [
          { no: 2789, text: 'ECH hides the real name. DNS 35 ms earlier ties 104.21.46.67 to arch.filemegahab4.sbs. This session then carries about 16 MB to the client in 22 seconds.' },
          { no: 24500, text: 'Lumma fingerprinting check-in. The Host header is whitepepper.su.' },
          { no: 27839, text: 'Follow-up .cc domains begin about 26 seconds after the check-in.' },
        ],
        caption: 'Rendered from tshark output. URIs shortened with … for width; the full values are in the IOC table.',
      },
    ],
    iocs: [
      { type: 'ipv4', value: '153.92.1.49', port: 80, role: 'Lumma Stealer C2 (alerted)', verdict: 'malicious', firstSeen: '2026-01-27T23:05:36Z' },
      { type: 'domain', value: 'whitepepper.su', role: 'Lumma Stealer C2 host name', verdict: 'malicious', firstSeen: '2026-01-27T23:05:36Z' },
      {
        type: 'url',
        value: 'http://whitepepper.su/api/set_agent?id=3BF67EC05320C5729578BE4C0ADF174C&token=842e2802df0f0a06b4ed51f12f4387e761523b&description=&agent=Chrome',
        role: 'Victim fingerprinting check-in',
        verdict: 'malicious',
        firstSeen: '2026-01-27T23:05:39Z',
        note: 'Repeated with agent=Edge at 23:05:47 and with &act=log on POST requests.',
      },
      { type: 'uri-pattern', value: '/api/set_agent?id=<32 hex>&token=<hex>&description=&agent=<browser>', role: 'Check-in URI structure', verdict: 'malicious' },
      { type: 'domain', value: 'arch.filemegahab4.sbs', role: 'Delivered ~16 MB over ECH-protected TLS before the check-in', verdict: 'suspicious', firstSeen: '2026-01-27T23:04:52Z', note: 'Resolved to Cloudflare 104.21.46.67 and 172.67.136.13; content is encrypted and not recoverable from the capture.' },
      { type: 'domain', value: 'media.megafilehub4.lat', role: 'Look-alike file-hosting page visited before the download', verdict: 'suspicious', firstSeen: '2026-01-27T23:04:49Z' },
      { type: 'domain', value: 'whooptm.cyou', role: 'Contacted 2 seconds before the Lumma check-in', verdict: 'suspicious', firstSeen: '2026-01-27T23:05:34Z', note: 'Resolved to 62.72.32.156. Purpose not determinable from encrypted traffic.' },
      { type: 'ipv4', value: '62.72.32.156', port: 443, role: 'whooptm.cyou server', verdict: 'suspicious', firstSeen: '2026-01-27T23:05:34Z' },
      { type: 'domain', value: 'holiday-forever.cc', role: 'Follow-up HTTPS after the check-in', verdict: 'suspicious', firstSeen: '2026-01-27T23:06:06Z' },
      { type: 'ipv4', value: '80.97.160.24', port: 443, role: 'holiday-forever.cc server', verdict: 'suspicious', firstSeen: '2026-01-27T23:06:06Z' },
      { type: 'domain', value: 'communicationfirewall-security.cc', role: 'Follow-up HTTPS after the check-in', verdict: 'suspicious', firstSeen: '2026-01-27T23:06:10Z' },
    ],
    timeline: [
      { time: '23:04:03', event: 'DESKTOP-ES9F3ML requests a DHCP lease and is assigned 10.1.21.58.', evidence: 'Frames 1–3 (DHCP)' },
      { time: '23:04:24', event: 'User gwyatt authenticates to the domain; the DC returns the full name Gabriel Wyatt.', evidence: 'Frame 214 (Kerberos), frame 358 (SAMR)' },
      { time: '23:04:44', event: 'Browser opens TLS sessions to drive.google.com.', evidence: 'TLS SNI' },
      { time: '23:04:49', event: 'DNS and TLS to media.megafilehub4.lat, a look-alike file-hosting site.', evidence: 'DNS, TLS SNI' },
      { time: '23:04:52', event: 'arch.filemegahab4.sbs resolves to 104.21.46.67; an ECH session to that IP delivers about 16 MB over 22 seconds.', evidence: 'Frames 2774, 2789; Statistics → Conversations' },
      { time: '23:05:34', event: 'TLS session to whooptm.cyou (62.72.32.156).', evidence: 'Frame 23675' },
      { time: '23:05:39', event: 'Lumma Stealer fingerprinting check-in to whitepepper.su over HTTP; repeated for Chrome and Edge.', evidence: 'Frames 24500, 24601, 25270, 25286' },
      { time: '23:06:06', event: 'HTTPS to holiday-forever.cc, then communicationfirewall-security.cc at 23:06:10.', evidence: 'Frames 27839, 28013' },
    ],
    incidentSummary:
      'On 2026-01-27 at 23:05 UTC, Windows client DESKTOP-ES9F3ML (10.1.21.58, user gwyatt / Gabriel Wyatt) sent Lumma Stealer fingerprinting check-ins to whitepepper[.]su on 153.92.1[.]49:80. About 47 seconds earlier the host downloaded roughly 16 MB from arch.filemegahab4[.]sbs after visiting look-alike file-hosting pages. Within a minute of the check-in it contacted two .cc domains over HTTPS.',
    rootCause:
      'The most likely root cause is a user-initiated download of a malicious archive or installer from a fake file-sharing site, which then ran Lumma Stealer. The capture supports the sequence and timing but cannot show the downloaded content because it was encrypted.',
    confidence: {
      level: 'High',
      rationale:
        'Victim identity and the Lumma C2 contact are directly visible in cleartext. The delivery step is Medium confidence: it rests on timing, size, and DNS attribution of an encrypted session.',
    },
    limitations: [
      'The 16 MB transfer was encrypted with TLS and ECH. Its file type and hash cannot be recovered from the capture.',
      'The purpose of whooptm[.]cyou and the two .cc domains cannot be confirmed from encrypted traffic alone; they are rated suspicious by timing, not by content.',
      'The capture covers about ten minutes. Anything before 23:04:03 or after 23:14:27 UTC is out of scope.',
    ],
    dataNotes: [
      'Some published write-ups of this scenario list the victim as 10.1.28.58. The capture contains no such address; the client is 10.1.21.58.',
    ],
    remediation: [
      'Isolate DESKTOP-ES9F3ML from the network and collect volatile evidence before reimaging.',
      'Treat every credential, browser session cookie, and saved password on the host as stolen. Reset gwyatt\'s domain password, revoke active sessions and tokens, and reset any accounts saved in Chrome or Edge.',
      'Block the listed domains and IPs at DNS and egress, but do not block Cloudflare ranges wholesale; block by name instead.',
      'Search proxy and DNS logs for set_agent check-ins and for the same look-alike file-hosting domains across the fleet.',
      'Review policies that let users run downloaded installers and archives from the browser, and consider application allow-listing.',
    ],
    furtherReading: [
      { title: 'Encrypted Client Hello (RFC 9849 draft lineage)', href: 'https://datatracker.ietf.org/doc/draft-ietf-tls-esni/', note: 'Why the SNI in one session reads cloudflare-ech.com.' },
      { title: 'Wireshark display filter reference: kerberos', href: 'https://www.wireshark.org/docs/dfref/k/kerberos.html', note: 'Field names used to recover the account name.' },
      { title: 'MITRE ATT&CK T1555.003 Credentials from Web Browsers', href: 'https://attack.mitre.org/techniques/T1555/003/', note: 'The theft behavior that drives the remediation steps.' },
    ],
    related: ['2026-08-09-formbook-xloader-c2-rotation', '2026-09-11-kongtuke-clickfix-chain'],
    downloads: ['2026-01-31-pcap'],
    answerStatus: 'verified',
    verification,
    source: { name: SOURCE_NAME, href: 'https://www.malware-traffic-analysis.net/2026/01/31/index.html' },
  },

  // ---------------------------------------------------------------------------------------------
  {
    slug: '2026-02-28-netsupport-rat-heartbeat',
    title: 'NetSupport Manager RAT heartbeat on TCP 443',
    date: '2026-02-28',
    summary:
      'Several SIEM hits for NetSupport Manager RAT point at one external server. The traffic uses port 443 but is not TLS: it is cleartext HTTP-style polling every 60 seconds for more than four hours.',
    scenario: [
      'Your SIEM shows repeated NetSupport Manager RAT signature hits for 45.131.214[.]85 over TCP port 443, starting 2026-02-28 at about 19:55 UTC.',
      'You retrieve a capture of the internal host behind those alerts. Write the incident report so the infected computer and its user can be found.',
    ],
    alerts: ['2026-02-28 19:55 UTC onward — NetSupport Manager RAT signatures — 45.131.214[.]85:443'],
    difficulty: 'Beginner',
    estimatedMinutes: 30,
    beginnerFriendly: true,
    category: 'Remote access trojan',
    topics: ['infected-host-identification', 'remote-access-trojans', 'c2-beaconing', 'http-analysis', 'active-directory', 'wireshark'],
    protocols: ['DHCP', 'NBNS', 'Kerberos', 'SAMR', 'HTTP', 'TCP'],
    evidenceTypes: ['PCAP'],
    captureWindowUtc: { start: '2026-02-28T19:55:06Z', end: '2026-03-01T00:16:35Z' },
    environment: [
      { label: 'Client and DC subnet', value: '10.2.28.0/24' },
      { label: 'Active Directory realm', value: 'EASYAS123.TECH' },
      { label: 'Domain controller', value: '10.2.28.2' },
      { label: 'Packets / duration', value: '15,512 packets over 4 h 21 min' },
    ],
    objectives: [
      ...hostIdObjectives,
      'Recognize cleartext C2 running on a port normally used for TLS.',
      'Measure a beacon interval from packet timestamps.',
    ],
    tools: commonTools,
    questions: [
      { id: 'ip', question: 'What is the IP address of the infected Windows client?', answer: '10.2.28.88', proof: 'ip.addr == 45.131.214.85' },
      { id: 'mac', question: 'What is the MAC address of the infected Windows client?', answer: '00:19:d1:b2:4d:ad', proof: 'dhcp.option.hostname == "DESKTOP-TEYQ2NR"' },
      { id: 'host', question: 'What is the host name of the infected Windows client?', answer: 'DESKTOP-TEYQ2NR', proof: 'browser.response_computer_name' },
      { id: 'user', question: 'What is the Windows user account name?', answer: 'brolf', proof: 'kerberos.CNameString && !(kerberos.CNameString contains "$")' },
      { id: 'name', question: 'What is the full name of the user?', answer: 'Becka Rolf', proof: 'samr.samr_UserInfo21.full_name' },
      { id: 'proto', question: 'What protocol is actually carried on TCP port 443 to 45.131.214[.]85?', answer: 'Cleartext HTTP (POST http://45.131.214.85/fakeurl.htm), not TLS', proof: 'tcp.stream eq 40  →  Follow TCP Stream' },
      { id: 'interval', question: 'What is the polling interval, and how long does the session last?', answer: 'About 60 seconds (60.1–60.3 s); 264 requests in one TCP connection lasting about 4 h 20 min', proof: "tshark -Y 'http.request && ip.dst==45.131.214.85' -T fields -e frame.time_epoch" },
    ],
    hints: [
      'Only one internal IP talks to the alerted server. Statistics → Conversations → TCP shows a single, very long connection.',
      'Wireshark decodes the port 443 traffic as HTTP, not TLS. That alone is a red flag worth writing in your report.',
      'Follow TCP Stream on the C2 connection. The User-Agent and Server headers name the software.',
      'For the interval, export frame.time_epoch for the requests and subtract each timestamp from the next.',
    ],
    evidenceViews: [
      {
        id: 'identity',
        title: 'Host and user identity',
        filter: 'dhcp.option.hostname || kerberos.CNameString == "brolf" || samr.samr_UserInfo21.full_name',
        rows: [
          { no: 2, time: '19:55:07.959', src: '0.0.0.0', dst: '255.255.255.255', proto: 'DHCP', info: 'DHCP Request - Transaction ID 0xafa98645' },
          { no: 243, time: '19:55:23.048', src: '10.2.28.88', dst: '10.2.28.2', proto: 'KRB5', info: 'AS-REQ' },
          { no: 339, time: '19:55:23.237', src: '10.2.28.2', dst: '10.2.28.88', proto: 'SAMR', info: 'QueryUserInfo response' },
        ],
        callouts: [
          { no: 2, text: 'Host Name DESKTOP-TEYQ2NR, requested IP 10.2.28.88, Ethernet source 00:19:d1:b2:4d:ad.' },
          { no: 243, text: 'CNameString = brolf.' },
          { no: 339, text: 'Full Name = Becka Rolf.' },
        ],
        caption: 'Rendered from tshark output. Times are UTC on 2026-02-28.',
      },
      {
        id: 'c2',
        title: 'NetSupport polling on port 443',
        filter: 'ip.addr == 45.131.214.85 && http',
        rows: [
          { no: 2638, time: '19:55:51.530', src: '10.2.28.88', dst: '45.131.214.85', proto: 'HTTP', info: 'POST http://45.131.214.85/fakeurl.htm HTTP/1.1 (application/x-www-form-urlencoded)' },
          { no: 2639, time: '19:55:51.678', src: '45.131.214.85', dst: '10.2.28.88', proto: 'HTTP', info: 'HTTP/1.1 200 OK (application/x-www-form-urlencoded)' },
          { no: 2640, time: '19:55:51.679', src: '10.2.28.88', dst: '45.131.214.85', proto: 'HTTP', info: 'POST http://45.131.214.85/fakeurl.htm HTTP/1.1 (application/x-www-form-urlencoded)' },
          { no: 2643, time: '19:55:52.038', src: '10.2.28.88', dst: '45.131.214.85', proto: 'HTTP', info: 'POST http://45.131.214.85/fakeurl.htm HTTP/1.1 (application/x-www-form-urlencoded)' },
        ],
        callouts: [
          { no: 2638, text: 'Absolute-URI request line, User-Agent: NetSupport Manager/1.3, body CMD=POLL.' },
          { no: 2639, text: 'Server: NetSupport Gateway/1.92 (Windows NT), body CMD=ENCD with an encrypted DATA field.' },
        ],
        caption: 'Rendered from tshark output. After the opening exchange, requests repeat every ~60 s until 00:16:28 UTC on 2026-03-01.',
      },
    ],
    iocs: [
      { type: 'ipv4', value: '45.131.214.85', port: 443, role: 'NetSupport Manager RAT gateway', verdict: 'malicious', firstSeen: '2026-02-28T19:55:51Z' },
      { type: 'url', value: 'http://45.131.214.85/fakeurl.htm', role: 'Polling endpoint (sent as cleartext over TCP 443)', verdict: 'malicious', firstSeen: '2026-02-28T19:55:51Z' },
      { type: 'user-agent', value: 'NetSupport Manager/1.3', role: 'Client User-Agent', verdict: 'suspicious', note: 'Legitimate NetSupport deployments also use this string. Treat it as malicious when the gateway is unapproved.' },
    ],
    timeline: [
      { time: '19:55:07', event: 'DESKTOP-TEYQ2NR renews DHCP for 10.2.28.88.', evidence: 'Frame 2' },
      { time: '19:55:23', event: 'brolf (Becka Rolf) authenticates to the domain.', evidence: 'Frames 243, 339' },
      { time: '19:55:51', event: 'First NetSupport POST to 45.131.214.85:443; gateway answers with an encrypted payload.', evidence: 'Frames 2638–2643, tcp.stream 40' },
      { time: '19:56:52 → 00:16:28', event: 'Polling continues every 60.1–60.3 seconds: 264 requests over one TCP connection.', evidence: 'tcp.stream 40' },
    ],
    incidentSummary:
      'Windows client DESKTOP-TEYQ2NR (10.2.28.88, user brolf / Becka Rolf) maintained a NetSupport Manager RAT session with 45.131.214[.]85 from 19:55:51 UTC on 2026-02-28 until at least 00:16:28 UTC on 2026-03-01. The traffic is cleartext HTTP polling on TCP 443 at a steady 60-second interval.',
    rootCause:
      'NetSupport Manager, a legitimate remote administration product, was installed and configured to report to an attacker-controlled gateway. The capture begins after installation, so the delivery method is not visible.',
    confidence: {
      level: 'High',
      rationale: 'The User-Agent, Server header, URI, and 60-second cadence are all visible in cleartext and match the alert. Host and user identity come straight from DHCP, Kerberos, and SAMR.',
    },
    limitations: [
      'The capture starts 45 seconds before the first C2 request, so it does not show how NetSupport arrived on the host.',
      'The DATA fields in gateway responses are encrypted by NetSupport; commands sent to the host cannot be read.',
    ],
    dataNotes: [
      'One published write-up of this scenario refers to 145.131.214.85 in its hints. The capture only contains 45.131.214.85.',
    ],
    remediation: [
      'Isolate DESKTOP-TEYQ2NR and treat it as remotely controlled: assume the attacker could see the screen, run commands, and move files.',
      'Find and remove the NetSupport client (client32.exe and its client32.ini) and any persistence that launches it.',
      'Reset brolf\'s credentials and review sign-ins during the session window.',
      'Block 45.131.214.85 and alert on any cleartext HTTP over TCP 443.',
      'If NetSupport is used legitimately in the organization, inventory approved gateways and alert on any others.',
    ],
    furtherReading: [
      { title: 'MITRE ATT&CK S0108 NetSupport Manager', href: 'https://attack.mitre.org/software/S0108/', note: 'How the legitimate tool is abused.' },
      { title: 'MITRE ATT&CK T1571 Non-Standard Port', href: 'https://attack.mitre.org/techniques/T1571/', note: 'Why HTTP on 443 matters.' },
      { title: 'Wireshark User Guide: Following Protocol Streams', href: 'https://www.wireshark.org/docs/wsug_html_chunked/ChAdvFollowStreamSection.html', note: 'Reading the C2 conversation.' },
    ],
    related: ['2026-10-01-exe-over-port-9000-and-rat-c2', '2026-01-31-lumma-stealer-fake-file-share'],
    downloads: ['2026-02-28-pcap'],
    answerStatus: 'verified',
    verification,
    source: { name: SOURCE_NAME, href: 'https://www.malware-traffic-analysis.net/2026/02/28/index.html' },
  },

  // ---------------------------------------------------------------------------------------------
  {
    slug: '2026-08-09-formbook-xloader-c2-rotation',
    title: 'FormBook/XLoader C2 rotation across fifteen domains',
    date: '2026-08-09',
    summary:
      'Two Windows clients share a capture, but only one is infected. That host cycles through fifteen domains, a new one about every 24 seconds, each with seven POSTs and one GET carrying a 2kn1= parameter.',
    scenario: [
      'You are covering a SOC shift and see a run of "FormBook CnC Checkin (GET)" alerts between 02:13 and 02:16 UTC on 2026-08-09, each to a different external IP, followed by more of the same.',
      'You retrieve a capture of the LAN segment during the alerts. More than one workstation appears in it. Identify the infected host and rule the other one in or out.',
    ],
    alerts: [
      '02:13 UTC — ET MALWARE FormBook CnC Checkin (GET) — 172.64.155[.]76:80',
      '02:14 UTC — ET MALWARE FormBook CnC Checkin (GET) — 146.59.71[.]167:80',
      '02:14 UTC — ET MALWARE FormBook CnC Checkin (GET) — 38.182.168[.]246:80',
      '02:15 UTC — ET MALWARE FormBook CnC Checkin (GET) — 45.130.41[.]161:80',
      '02:15 UTC — ET MALWARE FormBook CnC Checkin (GET) — 172.67.162[.]153:80',
      '02:16 UTC — ET MALWARE FormBook CnC Checkin (GET) — 121.54.163[.]148:80',
    ],
    difficulty: 'Intermediate',
    estimatedMinutes: 60,
    beginnerFriendly: false,
    category: 'Information stealer',
    topics: ['infected-host-identification', 'information-stealers', 'c2-beaconing', 'http-analysis', 'dns-analysis', 'active-directory'],
    protocols: ['DHCP', 'NBNS', 'Kerberos', 'SAMR', 'DNS', 'HTTP'],
    evidenceTypes: ['PCAP'],
    captureWindowUtc: { start: '2026-08-09T02:07:32Z', end: '2026-08-09T02:21:32Z' },
    environment: [
      { label: 'Client and DC subnet', value: '172.16.8.0/24' },
      { label: 'Active Directory realm', value: 'FIRSTTOLAST.TECH' },
      { label: 'Domain controller', value: '172.16.8.8 (FIRSTTOLAST-DC)' },
      { label: 'Windows clients in capture', value: '172.16.8.49 and 172.16.8.53' },
    ],
    objectives: [
      ...hostIdObjectives,
      'Separate an infected host from a clean host in the same capture.',
      'Enumerate a rotating C2 domain list and describe its request pattern.',
      'Recognize decoy traffic to legitimate sites and avoid over-blocking shared CDN IPs.',
    ],
    tools: commonTools,
    questions: [
      { id: 'ip', question: 'What is the IP address of the infected Windows client?', answer: '172.16.8.49', proof: 'ip.addr == 146.59.71.167' },
      { id: 'mac', question: 'What is the MAC address of the infected Windows client?', answer: '00:12:f0:28:d4:34', proof: 'nbns && ip.src == 172.16.8.49' },
      { id: 'host', question: 'What is the host name of the infected Windows client?', answer: 'DESKTOP-5NLV63K', proof: 'browser.response_computer_name' },
      { id: 'user', question: 'What is the Windows user account name?', answer: 'rvance', proof: 'kerberos.CNameString && ip.dst == 172.16.8.49' },
      { id: 'name', question: 'What is the full name of the user?', answer: 'Raymond Vance', proof: 'samr.samr_UserInfo21.full_name && ip.dst == 172.16.8.49' },
      { id: 'other', question: 'Is the second client (172.16.8.53) infected?', answer: 'No evidence of infection. DESKTOP-A8WD4E2 (mhanson / Margaret Hanson) made only two HTTP requests, to edge.microsoft.com and www.msftconnecttest.com.', proof: 'http.request && ip.src == 172.16.8.53' },
      { id: 'count', question: 'How many distinct host names receive the C2 request pattern?', answer: '15, from 02:13:23 to 02:19:48 UTC', proof: 'http.request && http.request.uri matches "^/[a-z0-9]{4}/"' },
    ],
    hints: [
      'Two hosts means two sets of DHCP, NBNS, Kerberos, and SAMR records. Build a small table for each before deciding which one is infected.',
      'Use one of the alerted IPs as a pivot: only one internal IP talks to it.',
      'Statistics → HTTP → Requests groups requests by host. Look for a run of unfamiliar hosts that all use a four-character path.',
      'One of the hosts in the pattern is a well-known news site behind Cloudflare. Ask what that means before you add its IP to a block list.',
    ],
    evidenceViews: [
      {
        id: 'identity',
        title: 'Two clients, two identities',
        filter: 'samr.samr_UserInfo21.full_name || (kerberos.CNameString && !(kerberos.CNameString contains "$"))',
        rows: [
          { no: 1153, time: '02:07:45.319', src: '172.16.8.8', dst: '172.16.8.53', proto: 'SAMR', info: 'QueryUserInfo response' },
          { no: 1884, time: '02:08:13.508', src: '172.16.8.49', dst: '172.16.8.255', proto: 'NBNS', info: 'Registration NB DESKTOP-5NLV63K<00>' },
          { no: 2799, time: '02:08:27.534', src: '172.16.8.49', dst: '172.16.8.8', proto: 'KRB5', info: 'AS-REQ' },
          { no: 2947, time: '02:08:27.570', src: '172.16.8.8', dst: '172.16.8.49', proto: 'SAMR', info: 'QueryUserInfo response' },
        ],
        callouts: [
          { no: 1153, text: 'Full Name = Margaret Hanson (the uninfected client, 172.16.8.53).' },
          { no: 2799, text: 'CNameString = rvance.' },
          { no: 2947, text: 'Full Name = Raymond Vance (172.16.8.49).' },
        ],
        caption: 'Rendered from tshark output. Times are UTC on 2026-08-09.',
      },
      {
        id: 'c2',
        title: 'Seven POSTs and a GET, then the next domain',
        filter: 'http.request && ip.src == 172.16.8.49 && http.request.uri matches "^/[a-z0-9]{4}/"',
        rows: [
          { no: 11032, time: '02:13:23.953', src: '172.16.8.49', dst: '172.64.155.76', proto: 'HTTP', info: 'POST /ujvq/ HTTP/1.1 (Host: www.independent.ie)' },
          { no: 11041, time: '02:13:26.514', src: '172.16.8.49', dst: '172.64.155.76', proto: 'HTTP', info: 'GET /ujvq/?2kn1=AbAb9leelkMdsDG0ZMsE+f3kkKlSohVT… HTTP/1.1' },
          { no: 11227, time: '02:14:07.182', src: '172.16.8.49', dst: '146.59.71.167', proto: 'HTTP', info: 'POST /irpw/ HTTP/1.1 (Host: www.grinswakebthu.info)' },
          { no: 12076, time: '02:14:31.507', src: '172.16.8.49', dst: '38.182.168.246', proto: 'HTTP', info: 'POST /lqjm/ HTTP/1.1 (Host: www.taibeinan.cc)' },
          { no: 13355, time: '02:15:03.749', src: '172.16.8.49', dst: '45.130.41.161', proto: 'HTTP', info: 'POST /8nw8/ HTTP/1.1 (Host: www.legenda-sochi.com)' },
          { no: 14002, time: '02:15:28.095', src: '172.16.8.49', dst: '172.67.162.153', proto: 'HTTP', info: 'POST /r7l3/ HTTP/1.1 (Host: www.titanium303.com)' },
          { no: 14469, time: '02:15:52.388', src: '172.16.8.49', dst: '121.54.163.148', proto: 'HTTP', info: 'POST /hut9/ HTTP/1.1 (Host: www.21207628.shop)' },
        ],
        callouts: [
          { no: 11041, text: 'The alerted "CnC Checkin (GET)" request: a 4-character path plus a 2kn1= query string.' },
          { no: 11227, text: 'A new host roughly every 24 seconds, always with the same User-Agent: Firefox/39.0 on Windows NT 6.2.' },
        ],
        caption: 'Rendered from tshark output; Host header added to the Info column for readability. First request per host shown.',
      },
    ],
    iocs: [
      { type: 'user-agent', value: 'Mozilla/5.0 (Windows NT 6.2; rv:39.0) Gecko/20100101 Firefox/39.0', role: 'C2 request User-Agent (2015-era browser on a 2026 host)', verdict: 'suspicious' },
      { type: 'uri-pattern', value: '/<4 alnum>/?<optional param>&2kn1=<base64-like>', role: 'FormBook/XLoader check-in GET', verdict: 'malicious' },
      { type: 'domain', value: 'www.grinswakebthu.info', role: 'C2 (146.59.71.167, /irpw/)', verdict: 'malicious', firstSeen: '2026-08-09T02:14:07Z' },
      { type: 'domain', value: 'www.taibeinan.cc', role: 'C2 (38.182.168.246, /lqjm/)', verdict: 'malicious', firstSeen: '2026-08-09T02:14:31Z' },
      { type: 'domain', value: 'www.legenda-sochi.com', role: 'C2 (45.130.41.161, /8nw8/)', verdict: 'malicious', firstSeen: '2026-08-09T02:15:03Z' },
      { type: 'domain', value: 'www.titanium303.com', role: 'C2 (172.67.162.153, /r7l3/)', verdict: 'malicious', firstSeen: '2026-08-09T02:15:28Z' },
      { type: 'domain', value: 'www.21207628.shop', role: 'C2 (121.54.163.148, /hut9/)', verdict: 'malicious', firstSeen: '2026-08-09T02:15:52Z' },
      { type: 'domain', value: 'www.kentmediallc.com', role: 'C2 (199.192.27.50, /7qex/)', verdict: 'malicious', firstSeen: '2026-08-09T02:16:29Z' },
      { type: 'domain', value: 'www.earthframe.site', role: 'C2 (66.29.149.91, /v2r8/)', verdict: 'malicious', firstSeen: '2026-08-09T02:16:54Z' },
      { type: 'domain', value: 'www.p3x63q.garden', role: 'C2 (183.90.186.205, /ttsm/)', verdict: 'malicious', firstSeen: '2026-08-09T02:17:19Z' },
      { type: 'domain', value: 'www.z61gqw.beer', role: 'C2 (156.247.51.39, /nxc3/)', verdict: 'malicious', firstSeen: '2026-08-09T02:17:49Z' },
      { type: 'domain', value: 'www.www-bet456.co', role: 'C2 (172.67.219.130, /h3j8/)', verdict: 'malicious', firstSeen: '2026-08-09T02:18:14Z' },
      { type: 'domain', value: 'www.moxom.online', role: 'C2 (81.2.196.19, /1l1j/)', verdict: 'malicious', firstSeen: '2026-08-09T02:18:37Z' },
      { type: 'domain', value: 'www.thvwzs.com', role: 'C2 (104.21.76.210, /tza3/)', verdict: 'malicious', firstSeen: '2026-08-09T02:19:01Z' },
      { type: 'domain', value: 'www.devinnovationhab.team', role: 'C2 (104.21.42.23, /rd80/)', verdict: 'malicious', firstSeen: '2026-08-09T02:19:25Z' },
      { type: 'domain', value: 'www.amlgames.site', role: 'C2 (89.110.89.25, /ll40/)', verdict: 'malicious', firstSeen: '2026-08-09T02:19:48Z' },
      { type: 'domain', value: 'www.vjscloudjsns.beer', role: 'C2 candidate that failed to resolve (NXDOMAIN)', verdict: 'suspicious' },
      { type: 'domain', value: 'www.independent.ie', role: 'Legitimate news site contacted with the C2 pattern (decoy)', verdict: 'abused-legitimate', firstSeen: '2026-08-09T02:13:23Z', note: 'Do not block. Its Cloudflare IP 172.64.155.76 is shared with many unrelated sites, yet it is the first alerted IP.' },
      { type: 'ipv4', value: '146.59.71.167', port: 80, role: 'C2 server', verdict: 'malicious' },
      { type: 'ipv4', value: '38.182.168.246', port: 80, role: 'C2 server', verdict: 'malicious' },
      { type: 'ipv4', value: '45.130.41.161', port: 80, role: 'C2 server', verdict: 'malicious' },
      { type: 'ipv4', value: '121.54.163.148', port: 80, role: 'C2 server', verdict: 'malicious' },
    ],
    timeline: [
      { time: '02:07:45', event: 'Clean client DESKTOP-A8WD4E2 (172.16.8.53, mhanson) logs on.', evidence: 'Frame 1153' },
      { time: '02:08:12', event: 'DESKTOP-5NLV63K (172.16.8.49) obtains DHCP; rvance (Raymond Vance) logs on at 02:08:27.', evidence: 'Frames 1828, 2799, 2947' },
      { time: '02:13:23', event: 'First C2-pattern request, to www.independent.ie (decoy).', evidence: 'Frame 11032' },
      { time: '02:14:07 → 02:19:48', event: 'Fourteen more hosts receive the same seven-POST/one-GET pattern about every 24 seconds.', evidence: 'Frames 11227 … 20931' },
      { time: '02:21:07', event: 'Last C2-pattern request in the capture.', evidence: 'HTTP request log' },
    ],
    incidentSummary:
      'Windows client DESKTOP-5NLV63K (172.16.8.49, user rvance / Raymond Vance) generated FormBook/XLoader-style C2 traffic from 02:13:23 to 02:21:07 UTC on 2026-08-09, rotating through fifteen host names on port 80. The second client, DESKTOP-A8WD4E2 (172.16.8.53, mhanson), shows no malicious activity.',
    rootCause:
      'The host is running FormBook or its successor XLoader. The infection itself happened before the capture window; the capture shows only post-infection C2.',
    confidence: {
      level: 'High',
      rationale:
        'All six alerted IPs map to 172.16.8.49 and share an identical request structure and User-Agent. The FormBook versus XLoader distinction is Medium confidence: the traffic pattern fits both, and XLoader is widely documented as FormBook\'s successor.',
    },
    limitations: [
      'POST bodies are encoded by the malware; this exercise does not decode them.',
      'The capture does not show the initial infection vector.',
      'Whether every listed domain is attacker-owned or compromised cannot be established from traffic alone.',
    ],
    dataNotes: ['Some published versions of the answer spell the user\'s first name "Ryamond". SAMR in the capture returns "Raymond Vance".'],
    remediation: [
      'Isolate DESKTOP-5NLV63K and reimage after evidence collection. FormBook/XLoader steals browser credentials, clipboard contents, and keystrokes.',
      'Reset rvance\'s credentials and any passwords stored in browsers on that host.',
      'Block the malicious domains by name. Do not block shared Cloudflare IPs such as 172.64.155.76, and do not block www.independent.ie.',
      'Hunt across proxy logs for the Firefox/39.0 User-Agent and the 2kn1= query parameter.',
      'Document 172.16.8.53 as reviewed and not infected, with the evidence used.',
    ],
    furtherReading: [
      { title: 'Malpedia: XLoader', href: 'https://malpedia.caad.fkie.fraunhofer.de/details/win.xloader', note: 'Background on the FormBook successor.' },
      { title: 'Malpedia: FormBook', href: 'https://malpedia.caad.fkie.fraunhofer.de/details/win.formbook', note: 'Family reference and historical C2 behavior.' },
      { title: 'MITRE ATT&CK T1071.001 Web Protocols', href: 'https://attack.mitre.org/techniques/T1071/001/', note: 'C2 over HTTP.' },
    ],
    related: ['2026-01-31-lumma-stealer-fake-file-share', '2026-09-11-kongtuke-clickfix-chain'],
    downloads: ['2026-08-09-pcap'],
    answerStatus: 'verified',
    verification,
    source: { name: SOURCE_NAME, href: 'https://www.malware-traffic-analysis.net/2026/08/09/index.html' },
  },

  // ---------------------------------------------------------------------------------------------
  {
    slug: '2026-09-11-kongtuke-clickfix-chain',
    title: 'KongTuke ClickFix chain from a compromised site to HTTP C2',
    date: '2026-09-11',
    summary:
      'A visit to a legitimate-looking site is followed within a second by QUIC traffic to a KongTuke domain, a burst of short-lived domains, a 36 MB download from nodejs.org, and cleartext HTTP C2 that rotates across four domains.',
    scenario: [
      'This capture comes from a domain-joined Windows host that followed a fake "verify you are human" page (ClickFix) delivered through KongTuke web injects.',
      'Use only the PCAP. Reconstruct the chain from first site visit to command-and-control, and identify the host and user.',
    ],
    alerts: ['No SIEM alert is provided. You are told only that the host followed a ClickFix lure.'],
    difficulty: 'Advanced',
    estimatedMinutes: 90,
    beginnerFriendly: false,
    category: 'Social engineering (ClickFix)',
    topics: ['social-engineering', 'tls-analysis', 'dns-analysis', 'c2-beaconing', 'http-analysis', 'infected-host-identification'],
    protocols: ['BROWSER', 'Kerberos', 'SAMR', 'DNS', 'TLS', 'QUIC', 'HTTP'],
    evidenceTypes: ['PCAP'],
    captureWindowUtc: { start: '2026-09-11T20:05:55Z', end: '2026-09-11T20:27:05Z' },
    environment: [
      { label: 'Client and DC subnet', value: '10.9.11.0/24' },
      { label: 'Active Directory realm', value: 'OVERHANDS.ORG' },
      { label: 'Domain controller', value: '10.9.11.2 (WIN-GTWXC9UYSE4)' },
      { label: 'Packets / duration', value: '73,626 packets over 21 minutes' },
    ],
    objectives: [
      ...hostIdObjectives,
      'Read SNI from QUIC Initial packets as well as TLS Client Hellos.',
      'Order a multi-stage infection chain using DNS and SNI timestamps.',
      'Identify legitimate infrastructure that an infection chain abuses.',
    ],
    tools: [...commonTools, 'Wireshark 4.x is required to dissect QUIC Initial packets and show their SNI'],
    questions: [
      { id: 'ip', question: 'What is the IP address of the infected Windows client?', answer: '10.9.11.135', proof: 'http.request && ip.dst == 86.106.87.134' },
      { id: 'mac', question: 'What is the MAC address of the infected Windows client?', answer: '08:d4:0c:7a:29:1e', proof: 'browser.response_computer_name' },
      { id: 'host', question: 'What is the host name of the infected Windows client?', answer: 'DESKTOP-6T17ZFM', proof: 'browser.response_computer_name' },
      { id: 'user', question: 'What is the Windows user account name?', answer: 'gmcdowell', proof: 'kerberos.CNameString && !(kerberos.CNameString contains "$")' },
      { id: 'name', question: 'What is the full name of the user?', answer: 'Gabriel McDowell', proof: 'samr.samr_UserInfo21.full_name' },
      { id: 'inject', question: 'Which domain did the browser reach over QUIC less than a second after the first site loaded?', answer: 'aatthews[.]cfd (172.67.205.86)', proof: 'quic && ip.addr == 172.67.205.86' },
      { id: 'legit', question: 'Which legitimate developer site delivered about 36 MB shortly after the ClickFix domains?', answer: 'nodejs.org (104.16.212.131)', proof: 'tls.handshake.extensions_server_name == "nodejs.org"' },
      { id: 'c2', question: 'Which server received the periodic cleartext HTTP C2, and how often?', answer: 'know.mom-nower[.]com at 86.106.87[.]134:80, about every 10 seconds (73 requests from 20:06:57 to 20:26:47 UTC)', proof: 'http.request && ip.dst == 86.106.87.134' },
    ],
    hints: [
      'There is no NBNS registration here. The BROWSER protocol announcement carries the host name, and its Ethernet header carries the MAC.',
      'Build an SNI timeline with a column for tls.handshake.extensions_server_name. Add quic to your filter: some sessions use HTTP/3.',
      'Large transfers stand out in Statistics → Conversations → TCP sorted by bytes. Map each IP back to a name with DNS.',
      'C2 URIs share a 64-character hex token after an ampersand. The token changes once during the capture.',
    ],
    evidenceViews: [
      {
        id: 'chain',
        title: 'From first site to download',
        filter: 'tls.handshake.type == 1 || quic',
        rows: [
          { no: 9, time: '20:05:55.975', src: '10.9.11.135', dst: '104.196.13.170', proto: 'TLSv1.2', info: 'Client Hello (SNI=quadcinema.com)' },
          { no: 53, time: '20:05:56.374', src: '10.9.11.135', dst: '172.67.205.86', proto: 'QUIC', info: 'Initial, DCID=472af9f896d2a9b5 … (SNI=aatthews.cfd)' },
          { no: 3217, time: '20:06:33.131', src: '10.9.11.135', dst: '104.21.91.138', proto: 'TLSv1.2', info: 'Client Hello (SNI=winrun2915.com)' },
          { no: 5224, time: '20:06:36.166', src: '10.9.11.135', dst: '172.67.214.168', proto: 'TLSv1.2', info: 'Client Hello (SNI=logincrypt8338.com)' },
          { no: 5289, time: '20:06:38.553', src: '10.9.11.135', dst: '172.67.180.55', proto: 'TLSv1.2', info: 'Client Hello (SNI=opscast3707.net)' },
          { no: 14229, time: '20:06:42.504', src: '10.9.11.135', dst: '172.67.155.32', proto: 'TLSv1.2', info: 'Client Hello (SNI=www.xos-aploq.com)' },
          { no: 14305, time: '20:06:47.517', src: '10.9.11.135', dst: '104.16.212.131', proto: 'TLSv1.2', info: 'Client Hello (SNI=nodejs.org)' },
          { no: 62434, time: '20:06:57.558', src: '10.9.11.135', dst: '86.106.87.134', proto: 'HTTP', info: 'GET /zgzly/e2fkf6&4a0fd955…bc16e9/o3m8xrq0rab HTTP/1.1' },
        ],
        callouts: [
          { no: 53, text: 'HTTP/3 over QUIC. Wireshark decrypts the Initial packet with public keys, which exposes the SNI.' },
          { no: 5289, text: 'About 7.5 MB from opscast3707.net over 62 seconds.' },
          { no: 14305, text: 'About 36 MB from nodejs.org in under 4 seconds: likely the Node.js runtime, fetched by the chain.' },
          { no: 62434, text: 'First cleartext C2 request, 10 seconds after soft.xos-aploq.com.' },
        ],
        caption: 'Rendered from tshark output. Times are UTC on 2026-09-11. SNI for QUIC rows comes from the dissected CRYPTO frame.',
      },
    ],
    iocs: [
      { type: 'domain', value: 'quadcinema.com', role: 'First site visited; likely compromised and serving the inject', verdict: 'suspicious', firstSeen: '2026-09-11T20:05:55Z', note: 'Encrypted traffic cannot prove the inject; rating based on sequence.' },
      { type: 'domain', value: 'aatthews.cfd', role: 'KongTuke inject domain reached over QUIC', verdict: 'malicious', firstSeen: '2026-09-11T20:05:56Z' },
      { type: 'domain', value: 'winrun2915.com', role: 'ClickFix chain domain', verdict: 'malicious', firstSeen: '2026-09-11T20:06:33Z' },
      { type: 'domain', value: 'logincrypt8338.com', role: 'ClickFix chain domain', verdict: 'malicious', firstSeen: '2026-09-11T20:06:36Z' },
      { type: 'domain', value: 'opscast3707.net', role: 'Delivered ~7.5 MB', verdict: 'malicious', firstSeen: '2026-09-11T20:06:38Z' },
      { type: 'domain', value: 'www.xos-aploq.com', role: 'Chain domain (also jaw. and soft. subdomains)', verdict: 'malicious', firstSeen: '2026-09-11T20:06:42Z' },
      { type: 'domain', value: 'nodejs.org', role: 'Legitimate site; ~36 MB download in the chain', verdict: 'abused-legitimate', firstSeen: '2026-09-11T20:06:47Z', note: 'Do not block. Hunt for node.exe in user-writable paths instead.' },
      { type: 'domain', value: 'registry.npmjs.org', role: 'Legitimate package registry contacted after the download', verdict: 'abused-legitimate', firstSeen: '2026-09-11T20:08:59Z' },
      { type: 'domain', value: 'know.mom-nower.com', role: 'Primary HTTP C2', verdict: 'malicious', firstSeen: '2026-09-11T20:06:57Z' },
      { type: 'domain', value: 'globalcert8618.net', role: 'Queried every 48 seconds; always NXDOMAIN', verdict: 'suspicious', firstSeen: '2026-09-11T20:07:08Z', note: 'A beacon that never resolved during the capture. Sinkholing or a future registration would make it live.' },
      { type: 'ipv4', value: '86.106.87.134', port: 80, role: 'Primary C2 server (know.mom-nower.com, stream.fif-lost.com)', verdict: 'malicious', firstSeen: '2026-09-11T20:06:57Z' },
      { type: 'domain', value: 'stream.fif-lost.com', role: 'Secondary C2', verdict: 'malicious', firstSeen: '2026-09-11T20:22:46Z' },
      { type: 'domain', value: 'hyko.fif-lost.com', role: 'Secondary C2', verdict: 'malicious', firstSeen: '2026-09-11T20:24:27Z' },
      { type: 'domain', value: 'now.comonto-rsr.com', role: 'Secondary C2 (62.3.53.87)', verdict: 'malicious', firstSeen: '2026-09-11T20:22:17Z' },
      { type: 'domain', value: 'start.comonto-rsr.com', role: 'Secondary C2 (62.3.53.87)', verdict: 'malicious', firstSeen: '2026-09-11T20:23:52Z' },
      { type: 'domain', value: 'firt.comonto-rsr.com', role: 'Secondary C2', verdict: 'malicious', firstSeen: '2026-09-11T20:23:36Z' },
      { type: 'domain', value: 'second.bert-hits.com', role: 'Secondary C2 (146.70.139.165)', verdict: 'malicious', firstSeen: '2026-09-11T20:23:03Z' },
      { type: 'domain', value: 'gets.bert-hits.com', role: 'Secondary C2', verdict: 'malicious', firstSeen: '2026-09-11T20:23:20Z' },
      { type: 'domain', value: 'www.bert-hits.com', role: 'Secondary C2', verdict: 'malicious', firstSeen: '2026-09-11T20:24:42Z' },
      { type: 'ipv4', value: '62.3.53.87', port: 80, role: 'Secondary C2 server', verdict: 'malicious' },
      { type: 'ipv4', value: '146.70.139.165', port: 80, role: 'Secondary C2 server', verdict: 'malicious' },
      { type: 'uri-pattern', value: '/<random>/<random>&<64 hex token>[/<random>]', role: 'C2 URI structure', verdict: 'malicious', note: 'Tokens observed: 4a0fd955…bc16e9 until 20:08:57, then 99099296…dca1ab.' },
      { type: 'user-agent', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0', role: 'C2 User-Agent (spoofed Firefox)', verdict: 'suspicious' },
    ],
    timeline: [
      { time: '20:05:55', event: 'Browser opens quadcinema.com.', evidence: 'Frame 9' },
      { time: '20:05:56', event: 'QUIC session to aatthews.cfd (KongTuke inject).', evidence: 'Frame 53' },
      { time: '20:06:33 – 20:06:38', event: 'winrun2915.com, logincrypt8338.com, and opscast3707.net in five seconds; opscast3707.net delivers ~7.5 MB.', evidence: 'Frames 3217, 5224, 5289' },
      { time: '20:06:42 – 20:06:52', event: 'xos-aploq.com subdomains; nodejs.org delivers ~36 MB.', evidence: 'Frames 14229, 14279, 14305, 62283' },
      { time: '20:06:57', event: 'HTTP C2 to know.mom-nower.com begins at ~10-second intervals.', evidence: 'Frame 62434' },
      { time: '20:07:08', event: 'First of many DNS queries for globalcert8618.net, repeated every 48 seconds; every answer is NXDOMAIN.', evidence: 'Frames 62442–62443; dns.qry.name contains "globalcert"' },
      { time: '20:08:59', event: 'registry.npmjs.org contacted.', evidence: 'TLS SNI' },
      { time: '20:10:03', event: 'C2 token changes from 4a0fd955… to 99099296….', evidence: 'HTTP request log' },
      { time: '20:15:33', event: 'DC returns the full name Gabriel McDowell for gmcdowell.', evidence: 'Frame 70694' },
      { time: '20:22:17 – 20:24:42', event: 'C2 rotates to fif-lost.com, comonto-rsr.com, and bert-hits.com hosts; most reply 400 or 406.', evidence: 'Frames 72483 … 73230' },
      { time: '20:26:47', event: 'Last C2 request to 86.106.87.134.', evidence: 'HTTP request log' },
    ],
    incidentSummary:
      'On 2026-09-11 at 20:05 UTC, DESKTOP-6T17ZFM (10.9.11.135, user gmcdowell / Gabriel McDowell) loaded quadcinema.com and, within a second, contacted the KongTuke domain aatthews[.]cfd. Over the next minute it reached several short-lived domains, downloaded ~7.5 MB from opscast3707[.]net and ~36 MB from nodejs.org, then began cleartext HTTP C2 to know.mom-nower[.]com (86.106.87[.]134) every ~10 seconds, later rotating across three more C2 domains.',
    rootCause:
      'The user followed a ClickFix lure served through a KongTuke inject and ran the command it supplied. That command fetched additional components, apparently including the Node.js runtime, which then established HTTP C2.',
    confidence: {
      level: 'Medium',
      rationale:
        'Host identity and C2 are High confidence (cleartext). The ClickFix step is Medium: it is supported by the scenario and the tight sequence of DNS and SNI events, but the lure page and the command are inside encrypted sessions.',
    },
    limitations: [
      'The contents of the TLS and QUIC sessions, including the lure page and the downloaded files, are not visible in the capture.',
      'The capture cannot prove that the nodejs.org download was the Node.js runtime; that is inferred from size and timing.',
      'C2 payloads are encoded; their commands are not decoded here.',
    ],
    dataNotes: [],
    remediation: [
      'Isolate DESKTOP-6T17ZFM. Collect PowerShell and Run-dialog history (RunMRU), and look for node.exe or .js files in user-writable paths.',
      'Reset gmcdowell\'s credentials and revoke browser sessions.',
      'Block the malicious domains and C2 IPs. Do not block nodejs.org or registry.npmjs.org.',
      'Restrict the Windows Run dialog and PowerShell for standard users where feasible, and train users that no legitimate CAPTCHA asks them to paste commands.',
      'Hunt for HTTP requests whose URI contains "&" followed by 64 hex characters.',
    ],
    furtherReading: [
      { title: 'MITRE ATT&CK T1204.004 User Execution: Malicious Copy and Paste', href: 'https://attack.mitre.org/techniques/T1204/004/', note: 'The ClickFix technique.' },
      { title: 'RFC 9001: Using TLS to Secure QUIC', href: 'https://www.rfc-editor.org/rfc/rfc9001', note: 'Why QUIC Initial packets expose the SNI.' },
      { title: 'MITRE ATT&CK T1189 Drive-by Compromise', href: 'https://attack.mitre.org/techniques/T1189/', note: 'Compromised sites as delivery.' },
    ],
    related: ['2026-01-31-lumma-stealer-fake-file-share', '2026-10-01-exe-over-port-9000-and-rat-c2'],
    downloads: ['2026-09-11-pcap'],
    answerStatus: 'verified',
    verification,
    source: { name: SOURCE_NAME, href: 'https://www.malware-traffic-analysis.net/2026/09/11/index.html' },
  },

  // ---------------------------------------------------------------------------------------------
  {
    slug: '2026-10-01-exe-over-port-9000-and-rat-c2',
    title: 'EXE download over TCP 9000 and a custom-protocol RAT',
    date: '2026-10-01',
    summary:
      'curl fetches a Windows executable from a bare IP on port 9000. Six seconds later the host opens a 37-minute session on port 443 that is not TLS at all. Carve the EXE, hash it, and verify both alerts.',
    scenario: [
      'Two alerts fire for one Windows host: a Windows executable sent from 107.175.82[.]242 over the unusual TCP port 9000, and RAT C2 traffic to a server on port 443.',
      'You retrieve a capture of the host to verify both alerts and report the file hash.',
    ],
    alerts: [
      '107.175.82[.]242:9000 — Windows executable (EXE) sent over an unusual TCP port',
      '195.63.128[.]106:443 — RAT C2 traffic',
    ],
    difficulty: 'Intermediate',
    estimatedMinutes: 60,
    beginnerFriendly: false,
    category: 'Remote access trojan',
    topics: ['file-extraction', 'remote-access-trojans', 'http-analysis', 'infected-host-identification', 'c2-beaconing'],
    protocols: ['DHCP', 'BROWSER', 'Kerberos', 'DNS', 'HTTP', 'TLS', 'TCP'],
    evidenceTypes: ['PCAP'],
    captureWindowUtc: { start: '2026-10-01T19:27:27Z', end: '2026-10-01T20:07:58Z' },
    environment: [
      { label: 'Client and DC subnet', value: '10.10.1.0/24' },
      { label: 'Active Directory realm', value: 'NATUREFORCE.COM' },
      { label: 'Domain controller', value: '10.10.1.10' },
      { label: 'Packets / duration', value: '42,340 packets over 40.5 minutes' },
    ],
    objectives: [
      'Identify the Windows client\'s IP, MAC, host name, and account name.',
      'Export a file from an HTTP stream without executing it, and calculate its SHA-256.',
      'Recognize a non-TLS protocol on port 443 and describe it without overclaiming.',
      'Check alert details against the capture and report discrepancies.',
    ],
    tools: [...commonTools, 'sha256sum, Get-FileHash, or certutil for hashing'],
    questions: [
      { id: 'ip', question: 'What is the IP address of the infected Windows client?', answer: '10.10.1.128', proof: 'ip.addr == 107.175.82.242' },
      { id: 'mac', question: 'What is the MAC address of the infected Windows client?', answer: '00:22:fb:ec:7e:e7', proof: 'browser.response_computer_name' },
      { id: 'host', question: 'What is the host name of the infected Windows client?', answer: 'DESKTOP-4VGYQX7', proof: 'browser.response_computer_name' },
      { id: 'user', question: 'What is the Windows user account name?', answer: 'bdiaz', proof: 'kerberos.CNameString && !(kerberos.CNameString contains "$")' },
      {
        id: 'hash',
        question: 'What is the SHA-256 hash of the EXE sent from 107.175.82[.]242:9000?',
        answer: 'b789adce70c028a6d17be45ec34667aa95586350ee0c4057e75b138b1ad35061 (runner_ilove.exe, 1,646,592 bytes, PE32+ x86-64)',
        proof: 'File → Export Objects → HTTP… → runner_ilove.exe, then sha256sum',
      },
      { id: 'ua', question: 'What User-Agent requested the EXE, and what does it suggest?', answer: 'curl/8.21.0. A command-line download, not a browser.', proof: 'http.request && ip.dst == 107.175.82.242' },
      { id: 'c2', question: 'What C2 address does the capture show on port 443, and does it match the alert?', answer: '195.63.128.106. Some versions of the alert list 195.64.128.106, which never appears in the capture.', proof: 'ip.addr == 195.63.128.106' },
    ],
    hints: [
      'There is only one Windows client in this capture. browser.response_computer_name gets you its name, IP, and MAC in one row.',
      'Unlike the other exercises, this capture has no SAMR full-name record. Do not guess one.',
      'Filter on http.request and look at the destination port column. Port 9000 stands out.',
      'Export the object into an empty folder inside your analysis VM, hash it, and delete it. Never double-click it.',
      'Look at the first bytes the client sends to the port 443 server. A TLS session starts with 0x16 0x03.',
    ],
    evidenceViews: [
      {
        id: 'download',
        title: 'curl downloads an EXE from a bare IP',
        filter: '(http.request && http.user_agent contains "curl") || (http.response && ip.src == 107.175.82.242)',
        rows: [
          { no: 8235, time: '19:29:00.304', src: '10.10.1.128', dst: '35.170.55.9', proto: 'HTTP', info: 'GET /prw HTTP/1.1 (Host: holtandberyl.com)' },
          { no: 8345, time: '19:29:01.737', src: '10.10.1.128', dst: '35.170.55.9', proto: 'HTTP', info: 'GET /crv HTTP/1.1 (Host: holtandberyl.com)' },
          { no: 23091, time: '19:30:36.806', src: '10.10.1.128', dst: '107.175.82.242', proto: 'HTTP', info: 'GET /wilow/runner_ilove.exe HTTP/1.1 (port 9000)' },
          { no: 24916, time: '19:30:38.580', src: '107.175.82.242', dst: '10.10.1.128', proto: 'HTTP', info: 'HTTP/1.1 200 OK (binary/octet-stream), 1,646,592 bytes' },
          { no: 24963, time: '19:30:44.328', src: '10.10.1.128', dst: '195.63.128.106', proto: 'TCP', info: '63725 → 443 [SYN]' },
        ],
        callouts: [
          { no: 8235, text: 'curl/8.21.0 requests to holtandberyl.com are redirected (301) to HTTPS.' },
          { no: 23091, text: 'User-Agent curl/8.21.0, unusual port 9000, raw IP in the Host header.' },
          { no: 24916, text: 'Body starts with "MZ": a Windows PE file.' },
          { no: 24963, text: 'Six seconds later: a TCP session to 195.63.128.106:443 that runs until 20:07:57.' },
        ],
        caption: 'Rendered from tshark output; Host header and size added for readability. Times are UTC on 2026-10-01.',
      },
    ],
    iocs: [
      { type: 'sha256', value: 'b789adce70c028a6d17be45ec34667aa95586350ee0c4057e75b138b1ad35061', role: 'runner_ilove.exe (PE32+ x86-64, 1,646,592 bytes)', verdict: 'malicious' },
      { type: 'url', value: 'http://107.175.82.242:9000/wilow/runner_ilove.exe', role: 'EXE download', verdict: 'malicious', firstSeen: '2026-10-01T19:30:36Z' },
      { type: 'ipv4', value: '107.175.82.242', port: 9000, role: 'EXE download server', verdict: 'malicious', firstSeen: '2026-10-01T19:30:36Z' },
      { type: 'ipv4', value: '195.63.128.106', port: 443, role: 'RAT C2 (non-TLS binary protocol on 443)', verdict: 'malicious', firstSeen: '2026-10-01T19:30:44Z' },
      { type: 'filename', value: 'runner_ilove.exe', role: 'Downloaded executable', verdict: 'malicious' },
      { type: 'domain', value: 'holtandberyl.com', role: 'Fetched by curl 90 seconds before the EXE', verdict: 'suspicious', firstSeen: '2026-10-01T19:29:00Z', note: 'Resolved to 35.170.55.9; HTTP redirected to HTTPS, so the content is encrypted.' },
      { type: 'domain', value: 'sorrelapse.best', role: 'Visited in the browser before the curl activity', verdict: 'suspicious', firstSeen: '2026-10-01T19:28:31Z' },
      { type: 'user-agent', value: 'curl/8.21.0', role: 'Downloader User-Agent', verdict: 'suspicious', note: 'Legitimate tool; suspicious on a user workstation fetching EXEs from bare IPs.' },
    ],
    timeline: [
      { time: '19:27:27', event: 'DESKTOP-4VGYQX7 obtains DHCP for 10.10.1.128.', evidence: 'Frame 1' },
      { time: '19:27:46', event: 'bdiaz authenticates to the domain.', evidence: 'Frame 1214' },
      { time: '19:28:30', event: 'Browser visits www.ars-soar.com, then sorrelapse.best.', evidence: 'TLS SNI' },
      { time: '19:29:00', event: 'curl/8.21.0 requests holtandberyl.com/prw and /crv; both redirect to HTTPS.', evidence: 'Frames 8235, 8345' },
      { time: '19:30:36', event: 'curl downloads runner_ilove.exe from 107.175.82.242:9000.', evidence: 'Frames 23091, 24916' },
      { time: '19:30:44', event: 'TCP session to 195.63.128.106:443 begins: a non-TLS binary protocol.', evidence: 'Frame 24963' },
      { time: '19:30:44 → 20:07:57', event: 'The 443 session stays open for 37 minutes; the server sends about 14 MB to the client.', evidence: 'Statistics → Conversations' },
    ],
    incidentSummary:
      'On 2026-10-01 at 19:30:36 UTC, DESKTOP-4VGYQX7 (10.10.1.128, user bdiaz) used curl to download runner_ilove.exe (SHA-256 b789adce…1ad35061) from 107.175.82[.]242:9000. Six seconds later it opened a session to 195.63.128[.]106:443 using a binary, non-TLS protocol that lasted 37 minutes.',
    rootCause:
      'A command-line download (curl) pulled a malicious EXE that, once executed, established RAT C2. The use of curl shortly after browser visits to suspicious sites is consistent with a user being tricked into running a command, but the capture alone does not show how curl was launched.',
    confidence: {
      level: 'High',
      rationale: 'The download, the file hash, and the C2 session are directly observable. The causal link between the EXE and the C2 session rests on six seconds of timing and is High but not certain.',
    },
    limitations: [
      'No SAMR full-name record exists in this capture; the user\'s full name cannot be determined from it.',
      'The C2 protocol is binary and appears encoded; its commands are not decoded here.',
      'Wireshark may label parts of the 443 stream as "SSL" heuristically. The client\'s first bytes are not a TLS record header, which is why the session is described as non-TLS.',
    ],
    dataNotes: ['Some versions of the alert text list 195.64.128.106. The capture contains no packets to that address; the session is with 195.63.128.106.'],
    remediation: [
      'Isolate DESKTOP-4VGYQX7 and acquire memory before shutdown.',
      'Search all endpoints for the SHA-256 and for runner_ilove.exe; block the hash in EDR.',
      'Block 107.175.82.242 and 195.63.128.106, and alert on executables downloaded over non-standard ports.',
      'Alert on curl.exe or PowerShell downloading executables from bare IP addresses on workstations.',
      'Reset bdiaz\'s credentials.',
    ],
    furtherReading: [
      { title: 'Wireshark User Guide: Export Objects', href: 'https://www.wireshark.org/docs/wsug_html_chunked/ChIOExportSection.html', note: 'Carving files from captures.' },
      { title: 'MITRE ATT&CK T1105 Ingress Tool Transfer', href: 'https://attack.mitre.org/techniques/T1105/', note: 'Downloading tools with curl.' },
      { title: 'MITRE ATT&CK T1571 Non-Standard Port', href: 'https://attack.mitre.org/techniques/T1571/', note: 'Port 9000 delivery and non-TLS 443.' },
    ],
    related: ['2026-02-28-netsupport-rat-heartbeat', '2026-09-11-kongtuke-clickfix-chain'],
    downloads: ['2026-10-01-pcap'],
    answerStatus: 'verified',
    verification,
    source: { name: SOURCE_NAME, href: 'https://www.malware-traffic-analysis.net/2026/10/01/index.html' },
  },
]

export function getExercise(slug: string): Exercise | undefined {
  return exercises.find((e) => e.slug === slug)
}

/** Newest first. */
export function exercisesByDate(): Exercise[] {
  return [...exercises].sort((a, b) => b.date.localeCompare(a.date))
}
