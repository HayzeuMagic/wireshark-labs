---
title: 'When SNI says cloudflare-ech.com: attributing Encrypted Client Hello traffic'
description: Encrypted Client Hello hides the real server name. Recover it from DNS timing, and know how far that evidence can be pushed.
date: '2026-10-15'
topics: [tls-analysis, dns-analysis]
exercises: [2026-01-31-lumma-stealer-fake-file-share]
docs: []
references:
  - title: 'TLS Encrypted Client Hello (IETF draft)'
    href: https://datatracker.ietf.org/doc/draft-ietf-tls-esni/
  - title: 'Cloudflare: Encrypted Client Hello'
    href: https://developers.cloudflare.com/ssl/edge-certificates/ech/
---

For years the server name in the TLS Client Hello was the analyst's best friend in encrypted traffic. Encrypted Client Hello (ECH) takes it away: the real Client Hello, with the real server name, is encrypted inside an *outer* Client Hello addressed to a shared public name. On Cloudflare, that public name is `cloudflare-ech.com`.

This tutorial uses the [Lumma Stealer exercise](/exercises/2026-01-31-lumma-stealer-fake-file-share), where the most important download of the infection hides behind ECH.

## Spot the ECH session

Build the SNI timeline and look for the public name:

```wireshark
tls.handshake.extensions_server_name == "cloudflare-ech.com"
```

```output title="Result" source="tshark 4.4.6, 2026-01-31 exercise"
2789  23:04:52.308  10.1.21.58 → 104.21.46.67  Client Hello (SNI=cloudflare-ech.com)
```

On its own this tells you only "some site behind Cloudflare".

> [!WARNING]
> Do not hunt for ECH by the extension type alone. Chrome adds a placeholder ("GREASE") ECH extension, type 0xfe0d, to nearly every Client Hello. In this capture, `tls.handshake.extension.type == 65037` also matches sessions to Google, Microsoft, and Bing. The outer server name is the reliable signal.

## Recover the name from DNS

Before connecting, the browser resolved a name to 104.21.46.67. Find that answer:

```wireshark
dns.a == 104.21.46.67
```

```output title="Result" source="tshark 4.4.6, 2026-01-31 exercise"
2774  23:04:52.273  10.1.21.2 → 10.1.21.58  Standard query response A arch.filemegahab4.sbs A 104.21.46.67 A 172.67.136.13
```

The answer arrives **35 ms** before the Client Hello, from the client's own DNS server, for an address the client connects to immediately afterwards. That is strong evidence that the ECH session went to **arch.filemegahab4[.]sbs**.

## Check for competing names

Cloudflare serves many sites from the same addresses. Before you commit, check whether any **other** name resolved to the same IP shortly before:

```bash
tshark -r 2026-01-31-traffic-analysis-exercise.pcap -Y "dns.a == 104.21.46.67" \
  -T fields -e frame.time_utc -e dns.qry.name
```

Only one name maps to 104.21.46.67 in this capture. If there were two, you would need more context (timing, which page linked to which) and should say the attribution is uncertain.

## Size the session

```bash
tshark -r 2026-01-31-traffic-analysis-exercise.pcap -q -z conv,tcp,"ip.addr==104.21.46.67"
```

```output title="Result" source="tshark 4.4.6, 2026-01-31 exercise"
10.1.21.58:54840  <->  104.21.46.67:443   11470 16 MB   8252 629 kB   19722 16 MB   48.365246000   22.3897
```

About 16 MB from server to client in 22 seconds, 47 seconds before the first Lumma Stealer check-in. Combined with the preceding visits to `media.megafilehub4.lat`, a look-alike file-hosting site, that is the likely delivery of the malware.

## Write it up honestly

A good finding states the evidence and its limits:

> At 23:04:52 UTC, 10.1.21.58 resolved arch.filemegahab4[.]sbs to 104.21.46[.]67 (frame 2774) and 35 ms later opened an Encrypted Client Hello session to that address (frame 2789, outer SNI cloudflare-ech.com). The session delivered approximately 16 MB in 22 seconds. Attribution of the session to arch.filemegahab4[.]sbs is based on DNS timing; the content is encrypted and cannot be recovered.

## When DNS will not help

ECH is often deployed together with DNS over HTTPS. If the browser resolves names over DoH, the DNS answer is inside another encrypted session and this method fails. Then you are left with the destination IP, timing, volume, and endpoint telemetry, which knows the real URL. Say so in the report rather than guessing.
