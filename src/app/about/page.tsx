import type { Metadata } from 'next'
import Link from 'next/link'
import { AnswerStatusBadge } from '@/components/badges'
import { Container, PageHeader } from '@/components/page-header'
import { exercises } from '@/content/exercises'

export const metadata: Metadata = {
  title: 'About',
  description: 'What the Rivan Cybersecurity Lab is, who owns it, where its captures come from, and how answers are verified.',
}

export default function AboutPage() {
  const sources = [...new Map(exercises.map((e) => [e.source.name, e.source])).values()]
  return (
    <Container className="max-w-4xl">
      <PageHeader crumbs={[{ label: 'About' }]} kicker="About the lab" title="About Rivan Cybersecurity Lab" />
      <div className="prose-lab">
        <p>
          Rivan Cybersecurity Lab is Rivan&apos;s training ground for network traffic analysis and digital forensics. It sits alongside the
          Rivan Hacker Lab: where the Hacker Lab teaches offensive technique in an isolated range, this lab teaches the defender&apos;s side —
          reading what an intrusion leaves on the wire and turning it into a clear incident report.
        </p>

        <h2 id="purpose">Educational purpose</h2>
        <p>
          The lab is for students, SOC analysts, incident responders, and anyone learning network forensics. Each exercise gives you real
          evidence, a realistic scenario, and a set of questions. You investigate first; the answer report is there to check your reasoning,
          not to replace it.
        </p>

        <h2 id="ownership">Ownership and sources</h2>
        <p>
          The site, its design, documentation, tutorials, walkthroughs, evidence views, detection rules, and scripts are owned by Rivan.
          The packet captures used in the exercises were published by third parties for training; each exercise page credits its source
          with a link. Current capture sources:
        </p>
        <ul>
          {sources.map((s) => (
            <li key={s.name}>
              <a href={s.href.replace(/\/\d{4}\/.*$/, '/')} target="_blank" rel="noopener noreferrer" className="external">
                {s.name}
              </a>
            </li>
          ))}
        </ul>
        <p>
          Rivan does not republish third-party answer documents. Every walkthrough here was written by Rivan after reproducing the answers
          directly from the capture.
        </p>

        <h2 id="verification">How answers are verified</h2>
        <p>Each answer report carries one of three labels:</p>
        <div className="not-prose my-4 flex flex-wrap gap-2">
          <AnswerStatusBadge status="verified" />
          <AnswerStatusBadge status="illustrative" />
          <AnswerStatusBadge status="awaiting-validation" />
        </div>
        <ul>
          <li>
            <strong>Verified</strong> means every answer, frame number, timestamp, and indicator was reproduced from the published capture with
            tshark, and file hashes were calculated from objects exported from that capture. The answer table lists the filter or command that
            proves each one.
          </li>
          <li>
            <strong>Illustrative</strong> marks fictional teaching examples. Their values are invented, use reserved documentation ranges where
            possible, and are never presented as findings.
          </li>
          <li>
            <strong>Awaiting validation</strong> marks work that has not been reproduced yet. Those solutions are not published.
          </li>
        </ul>
        <p>
          When the capture disagrees with a scenario description or another published write-up, the capture wins, and the answer report says
          so under &ldquo;Notes on source data&rdquo;.
        </p>

        <h2 id="documentation-policy">Documentation policy</h2>
        <p>
          Every example output in the guide was produced by running the command against a lab capture, and every packet number and value
          can be checked in that capture.
        </p>

        <h2 id="responsible-use">Responsible use</h2>
        <p>
          Use the material for learning and for defending systems you are authorized to defend. Do not contact or probe infrastructure that
          appears in the captures. Read the <Link href="/safety">safety guide</Link> before downloading evidence.
        </p>
      </div>
    </Container>
  )
}
