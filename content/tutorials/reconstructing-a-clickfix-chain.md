---
title: Reconstructing a ClickFix chain from DNS, SNI, and QUIC
description: Order a fast, mostly encrypted infection chain using only names and timestamps, and separate what you saw from what you inferred.
date: '2026-10-15'
topics: [social-engineering, tls-analysis, dns-analysis, incident-reporting]
exercises: [2026-09-11-kongtuke-clickfix-chain, 2026-10-01-exe-over-port-9000-and-rat-c2]
docs: []
references:
  - title: 'MITRE ATT&CK T1204.004 User Execution: Malicious Copy and Paste'
    href: https://attack.mitre.org/techniques/T1204/004/
  - title: 'MITRE ATT&CK T1189 Drive-by Compromise'
    href: https://attack.mitre.org/techniques/T1189/
---

ClickFix lures show a fake error or "verify you are human" page and tell the user to paste a command into the Windows Run dialog or a terminal. The user runs the attacker's code themselves, so there is no exploit to detect. On the wire, the chain is a fast sequence of mostly encrypted connections. This tutorial rebuilds one from the [KongTuke exercise](/exercises/2026-09-11-kongtuke-clickfix-chain).

## 1. Collect every name with a timestamp

Merge DNS queries and TLS/QUIC server names into one list, keeping only the first appearance of each name:

```bash
PCAP=2026-09-11-traffic-analysis-exercise.pcap
{
  tshark -r $PCAP -Y "dns.flags.response == 0" -T fields -e frame.time_epoch -e dns.qry.name \
    | awk -F'\t' '{print $1"\tDNS\t"$2}'
  tshark -r $PCAP -Y "(tls.handshake.type == 1 || quic) && tls.handshake.extensions_server_name" \
    -T fields -e frame.time_epoch -e tls.handshake.extensions_server_name \
    | awk -F'\t' '{print $1"\tSNI\t"$2}'
} | sort -n | awk -F'\t' '!seen[$2 FS $3]++'
```

Then remove what you can explain: Microsoft, Google services, your own domain, and certificate checks.

## 2. Read the remaining names in order

```output title="Remaining names, first appearance" source="Summarized from tshark 4.4.6 output, 2026-09-11 exercise; protocol notes added"
20:05:55  quadcinema.com
20:05:56  aatthews.cfd             (QUIC)
20:06:33  winrun2915.com
20:06:36  logincrypt8338.com
20:06:38  opscast3707.net
20:06:42  www.xos-aploq.com
20:06:46  jaw.xos-aploq.com
20:06:47  nodejs.org
20:06:52  soft.xos-aploq.com
20:06:57  know.mom-nower.com       (HTTP)
20:07:08  globalcert8618.net       (NXDOMAIN)
```

## 3. Label each step: observed or inferred

| Time | Step | Observed | Inferred |
| --- | --- | --- | --- |
| 20:05:55 | Site visit | TLS to quadcinema.com | The site carried an inject (consistent with the next row) |
| 20:05:56 | Inject | QUIC to aatthews.cfd 0.4 s later | KongTuke script loaded; fake verification page shown |
| 20:05:56–20:06:33 | **User action** | 37 seconds with no new names | User follows the lure and runs a pasted command |
| 20:06:33–20:06:52 | Staging | Seven new host names in 19 s; 7.5 MB from opscast3707.net; 36 MB from nodejs.org | Command downloads payloads and a Node.js runtime |
| 20:06:57 | C2 | Cleartext HTTP to know.mom-nower.com every ~10 s | Implant running |
| 20:07:08 | Backup C2 | globalcert8618.net queried every 48 s, NXDOMAIN | Fallback name not (yet) registered |

The **gap** is part of the evidence. Human steps take seconds to minutes; automated steps take milliseconds. A 37-second pause between the inject and a burst of new domains is what a person reading and following instructions looks like.

## 4. Mind QUIC

The inject domain appears only over QUIC. A filter of `tls.handshake.type == 1` alone misses it, and so would any sensor that only parses TCP-based TLS. Always include `quic` when you build an SNI timeline.

## 5. Recognize abused legitimate services

`nodejs.org` and `registry.npmjs.org` are legitimate and must not be blocked. Their place in the chain is still meaningful: a 36 MB download from nodejs.org **seconds** after throwaway domains, on a workstation whose user is not a developer, is a lead for the endpoint team: look for `node.exe` and `.js` files in user-writable folders.

## 6. Compare with a second chain

The [port 9000 exercise](/exercises/2026-10-01-exe-over-port-9000-and-rat-c2) shows a similar shape with different tools: browser visits to `www.ars-soar.com` and `sorrelapse.best` at 19:28:30, a 30-second gap, then `curl/8.21.0` fetching URLs and finally an executable. The capture does not show the command, so the same rule applies: describe the sequence, call the user-execution step an inference, and ask the endpoint team to confirm it from process creation logs or the RunMRU registry key.

## 7. Write the finding

> Between 20:05:55 and 20:06:57 UTC, DESKTOP-6T17ZFM loaded quadcinema.com, contacted the KongTuke inject domain aatthews[.]cfd over QUIC, and after a 37-second pause contacted seven previously unseen host names in 19 seconds, downloading approximately 7.5 MB from opscast3707[.]net and 36 MB from nodejs.org before HTTP C2 to know.mom-nower[.]com began. The sequence and timing are consistent with a ClickFix lure; the lure page and executed command are not visible in the capture.
