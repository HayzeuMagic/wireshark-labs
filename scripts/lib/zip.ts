// Minimal, dependency-free ZIP writer with optional traditional PKWARE encryption (ZipCrypto).
//
// ZipCrypto is deliberately used instead of AES because it is the de-facto convention for
// distributing malware samples and malicious PCAPs ("infected" password): it opens in
// Windows Explorer, macOS Archive Utility, unzip, and 7-Zip without extra software. It exists
// to stop accidental opening and AV quarantine, not to protect secrets.
//
// Output is deterministic for identical input (fixed timestamp, seeded header bytes), so
// published SHA-256 checksums stay stable across rebuilds.

import { createHash } from 'node:crypto'
import { crc32, deflateRawSync } from 'node:zlib'

export interface ZipEntry {
  name: string
  data: Buffer
  /** Modification time recorded in the archive. */
  date: Date
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crcByte(crc: number, b: number): number {
  return (CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8)) >>> 0
}

class ZipCrypto {
  private k0 = 0x12345678
  private k1 = 0x23456789
  private k2 = 0x34567890

  constructor(password: string) {
    for (const b of Buffer.from(password, 'utf8')) this.update(b)
  }

  private update(b: number) {
    this.k0 = crcByte(this.k0, b)
    this.k1 = (this.k1 + (this.k0 & 0xff)) >>> 0
    this.k1 = (Math.imul(this.k1, 134775813) + 1) >>> 0
    this.k2 = crcByte(this.k2, this.k1 >>> 24)
  }

  private streamByte(): number {
    const t = (this.k2 | 2) & 0xffff
    return (Math.imul(t, t ^ 1) >>> 8) & 0xff
  }

  encrypt(buf: Buffer): Buffer {
    const out = Buffer.allocUnsafe(buf.length)
    for (let i = 0; i < buf.length; i++) {
      const p = buf[i]
      out[i] = p ^ this.streamByte()
      this.update(p)
    }
    return out
  }
}

function dosDateTime(d: Date): { time: number; date: number } {
  return {
    time: (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | Math.floor(d.getUTCSeconds() / 2),
    date: ((d.getUTCFullYear() - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate(),
  }
}

export function createZip(entries: ZipEntry[], password?: string): Buffer {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8')
    const crc = crc32(entry.data) >>> 0
    let body: Buffer = deflateRawSync(entry.data, { level: 9 })
    let flags = 0x0800 // UTF-8 names

    if (password) {
      flags |= 0x0001
      // 12-byte encryption header: 11 pseudo-random bytes seeded from the content, then the CRC check byte.
      const seed = createHash('sha256').update(entry.data).update(name).digest()
      const header = Buffer.alloc(12)
      seed.copy(header, 0, 0, 11)
      header[11] = (crc >>> 24) & 0xff
      const cipher = new ZipCrypto(password)
      body = Buffer.concat([cipher.encrypt(header), cipher.encrypt(body)])
    }

    if (body.length > 0xffffffff || entry.data.length > 0xffffffff) throw new Error(`${entry.name}: ZIP64 not supported`)
    const { time, date } = dosDateTime(entry.date)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(flags, 6)
    local.writeUInt16LE(8, 8)
    local.writeUInt16LE(time, 10)
    local.writeUInt16LE(date, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(body.length, 18)
    local.writeUInt32LE(entry.data.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(flags, 8)
    central.writeUInt16LE(8, 10)
    central.writeUInt16LE(time, 12)
    central.writeUInt16LE(date, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(body.length, 20)
    central.writeUInt32LE(entry.data.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt32LE(offset, 42)

    locals.push(local, name, body)
    centrals.push(central, name)
    offset += local.length + name.length + body.length
  }

  const centralDir = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralDir.length, 12)
  end.writeUInt32LE(offset, 16)

  return Buffer.concat([...locals, centralDir, end])
}
