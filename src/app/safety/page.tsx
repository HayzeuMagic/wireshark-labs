import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, PageHeader } from '@/components/page-header'
import { EVIDENCE_ZIP_PASSWORD } from '@/content/downloads'

export const metadata: Metadata = {
  title: 'Safety and responsible use',
  description: 'How to handle malware traffic captures and extracted files safely, and the rules for using the lab responsibly.',
}

export default function SafetyPage() {
  return (
    <Container className="max-w-4xl">
      <PageHeader
        crumbs={[{ label: 'Safety' }]}
        kicker="Safe handling"
        title="Safety and responsible use"
        description={<p>The captures in this lab are real. Some contain complete malware executables that Wireshark can export in two clicks.</p>}
      />
      <div className="prose-lab">
        <aside className="callout callout-caution" role="note">
          <p className="callout-title">The short version</p>
          <ul>
            <li>Analyze captures inside an isolated virtual machine, not on your everyday computer.</li>
            <li>Never run, open, or preview files exported from a capture.</li>
            <li>Never browse to, ping, scan, or resolve the domains and IPs you find.</li>
            <li>Verify checksums before and after you extract evidence.</li>
          </ul>
        </aside>

        <h2 id="what-is-in-a-pcap">What is in these captures</h2>
        <p>
          A packet capture records every byte that crossed the network. In the Rivan exercises that includes connections to live
          command-and-control servers, stolen-data uploads, and, in at least one exercise, a complete Windows executable downloaded over
          HTTP. Opening a PCAP in Wireshark is safe in itself: Wireshark reads the data, it does not execute it. The risk comes from what you
          do next — exporting and opening a file, or visiting a URL from the capture.
        </p>

        <h2 id="password">Why the ZIP files are password-protected</h2>
        <p>
          Every capture is distributed in a ZIP with the password <code>{EVIDENCE_ZIP_PASSWORD}</code>. This is the standard convention in the
          security community for sharing malicious samples. It is not secret. It exists so that:
        </p>
        <ul>
          <li>antivirus and email gateways do not delete or quarantine the file in transit;</li>
          <li>nobody opens the contents by double-clicking without meaning to;</li>
          <li>search engines and automated scanners do not index the payloads.</li>
        </ul>

        <h2 id="environment">Set up an isolated environment</h2>
        <ol>
          <li>Use a dedicated virtual machine. A Linux guest is safest for Windows malware traffic, because the payloads cannot run on it.</li>
          <li>Install Wireshark and update everything, then take a clean snapshot.</li>
          <li>Disconnect the VM network (or use host-only networking) before you open evidence.</li>
          <li>Disable shared folders, shared clipboard, and drag-and-drop between host and guest.</li>
          <li>When you finish, copy out only your notes and revert to the snapshot.</li>
        </ol>
        <p>
          The <Link href="/docs">VMware setup guide</Link> walks through this setup click by click.
        </p>

        <h2 id="extracted-files">Handling extracted files</h2>
        <p>
          Some exercises ask for a file hash. Export the object into an empty folder inside the VM, hash it, and delete it. Do not upload
          samples to public services unless your organization allows it; many already-known samples can be looked up by hash alone.
        </p>
        <pre className="rounded-lg border border-border bg-[hsl(222_30%_8.5%)] p-4 font-mono text-[13px] text-slate-300">
          {`mkdir -p ~/case/2026-10-01/objects && cd ~/case/2026-10-01/objects\ntshark -r ../2026-10-01-traffic-analysis-exercise.pcap -q --export-objects http,.\nsha256sum runner_ilove.exe\nrm -f ./*`}
        </pre>

        <h2 id="indicators">Handling indicators</h2>
        <p>
          The lab displays malicious domains, IPs, and URLs in defanged form, for example <code>whitepepper[.]su</code> and{' '}
          <code>hxxp://</code>, so they cannot be clicked or resolved by accident. Keep them defanged in your notes and reports. The CSV and JSON
          files include the raw values for loading into security tools; treat those files as sensitive data.
        </p>
        <p>
          Turn off external name resolution in Wireshark (View → Name Resolution → uncheck Resolve Network Addresses) so your analysis VM does not
          send DNS queries for attacker domains.
        </p>

        <h2 id="responsible-use">Responsible use</h2>
        <ul>
          <li>Use the material for education and for defending systems you are authorized to defend.</li>
          <li>Do not interact with attacker infrastructure. Passive analysis only.</li>
          <li>Do not use the detection content to test evasion against other people&apos;s systems.</li>
          <li>The people, host names, and domains in the captures belong to lab environments; do not try to identify or contact anyone.</li>
        </ul>
      </div>
    </Container>
  )
}
