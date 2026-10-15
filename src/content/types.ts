// Shared content types. These modules are imported by both the Next.js app and the
// build scripts in /scripts, so they must not import anything framework-specific.

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

/**
 * verified            – every answer was reproduced by Rivan from the published evidence file.
 * illustrative        – a fictional teaching example; values are not findings from a real capture.
 * awaiting-validation – written but not yet reproduced from evidence; not to be relied on.
 */
export type AnswerStatus = 'verified' | 'illustrative' | 'awaiting-validation'

export type IocType = 'ipv4' | 'domain' | 'url' | 'sha256' | 'user-agent' | 'uri-pattern' | 'filename'

export interface Ioc {
  type: IocType
  value: string
  /** Destination port, when the indicator was only observed on one port. */
  port?: number
  role: string
  /** First time seen in the capture (UTC, ISO 8601). */
  firstSeen?: string
  /** Malicious, suspicious, or legitimate-but-abused infrastructure. */
  verdict: 'malicious' | 'suspicious' | 'abused-legitimate'
  note?: string
}

export interface PacketRow {
  no: number
  /** UTC wall-clock time, HH:MM:SS.mmm */
  time: string
  src: string
  dst: string
  proto: string
  info: string
}

export interface EvidenceView {
  id: string
  title: string
  filter: string
  rows: PacketRow[]
  /** Annotations reference rows by frame number. */
  callouts: { no: number; text: string }[]
  caption: string
}

export interface Question {
  id: string
  question: string
  answer: string
  /** Display filter or command that proves the answer. */
  proof: string
}

export interface TimelineEvent {
  time: string
  event: string
  evidence: string
}

export interface Exercise {
  slug: string
  title: string
  /** Date of the exercise scenario as published by the capture source (YYYY-MM-DD). */
  date: string
  summary: string
  scenario: string[]
  alerts: string[]
  difficulty: Difficulty
  estimatedMinutes: number
  beginnerFriendly: boolean
  category: string
  topics: string[]
  protocols: string[]
  evidenceTypes: string[]
  captureWindowUtc: { start: string; end: string }
  environment: { label: string; value: string }[]
  objectives: string[]
  tools: string[]
  questions: Question[]
  hints: string[]
  evidenceViews: EvidenceView[]
  iocs: Ioc[]
  timeline: TimelineEvent[]
  incidentSummary: string
  rootCause: string
  confidence: { level: 'High' | 'Medium' | 'Low'; rationale: string }
  limitations: string[]
  dataNotes: string[]
  remediation: string[]
  furtherReading: { title: string; href: string; note: string }[]
  related: string[]
  downloads: string[]
  answerStatus: AnswerStatus
  verification: { date: string; method: string }
  source: { name: string; href: string }
}

export interface Topic {
  slug: string
  name: string
  description: string
}

export interface DownloadResource {
  id: string
  /** Path relative to public/downloads/files. */
  path: string
  title: string
  exercise: string
  /** ZIP password. */
  password: string
  /** The capture inside the archive; its own checksum is published too. */
  inner: { filename: string; sourcePath: string }
}
