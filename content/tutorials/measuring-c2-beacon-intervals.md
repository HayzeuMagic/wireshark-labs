---
title: Measuring C2 beacon intervals with tshark and awk
description: Turn packet timestamps into a beacon interval for three different C2 styles — a 60-second RAT, a 10-second HTTP implant, and a DNS name that never resolves.
date: '2026-10-15'
topics: [c2-beaconing, remote-access-trojans, wireshark]
exercises: [2026-02-28-netsupport-rat-heartbeat, 2026-09-11-kongtuke-clickfix-chain]
docs: []
references:
  - title: 'MITRE ATT&CK T1071 Application Layer Protocol'
    href: https://attack.mitre.org/techniques/T1071/
  - title: 'MITRE ATT&CK T1029 Scheduled Transfer'
    href: https://attack.mitre.org/techniques/T1029/
---

"It looks periodic" is an impression. "260 of 263 intervals fall between 60.1 and 60.3 seconds" is evidence. This tutorial shows a five-line method that works for any beacon and applies it to three real ones from the lab.

## The method

1. Write a display filter that selects one event per check-in.
2. Print `frame.time_epoch` for those packets.
3. Subtract each timestamp from the next.
4. Round and count.

```bash
tshark -r CAPTURE -Y 'FILTER' -T fields -e frame.time_epoch \
  | awk 'NR>1 {printf "%.1f\n", $1-prev} {prev=$1}' \
  | sort -n | uniq -c
```

Change `%.1f` to `%.0f` for coarser buckets.

## Beacon 1: NetSupport, one long connection

From the [NetSupport exercise](/exercises/2026-02-28-netsupport-rat-heartbeat). One event per check-in is one HTTP request to the gateway:

```bash
tshark -r 2026-02-28-traffic-analysis-exercise.pcap \
  -Y 'http.request && ip.dst==45.131.214.85' -T fields -e frame.time_epoch \
  | awk 'NR>1 {printf "%.1f\n", $1-prev} {prev=$1}' | sort -n | uniq -c
```

```output title="Result" source="tshark 4.4.6 + awk, 2026-02-28 exercise"
      1 0.1
      1 0.2
      1 0.4
    137 60.1
     87 60.2
     36 60.3
```

Three sub-second gaps from the opening exchange, then a near-perfect 60-second heartbeat. Jitter of 0.2 seconds is machine timing.

## Beacon 2: KongTuke follow-up C2, many short requests

From the [KongTuke exercise](/exercises/2026-09-11-kongtuke-clickfix-chain). Filter on the C2 host name:

```bash
tshark -r 2026-09-11-traffic-analysis-exercise.pcap \
  -Y 'http.request && http.host == "know.mom-nower.com"' -T fields -e frame.time_epoch \
  | awk 'NR>1 {printf "%.0f\n", $1-prev} {prev=$1}' | sort -n | uniq -c
```

```output title="Result" source="tshark 4.4.6 + awk, 2026-09-11 exercise"
      2 6
      1 9
     35 10
     25 11
      1 14
      1 19
      1 66
      1 146
      1 300
```

60 of 68 intervals are 10 or 11 seconds. The three long gaps are pauses in the check-ins, and two of them line up with other events: the 66-second gap (20:08:57 to 20:10:03 UTC) ends exactly when the URI token changes, and the 300-second gap (20:19:10 to 20:24:09) overlaps the implant trying its fallback C2 hosts.

> [!TIP]
> Do not summarize a beacon with the mean. Here the mean interval is 17.5 seconds because of three outliers, but no check-in actually happened at that spacing. Report the mode (10–11 s) and mention the gaps.

## Beacon 3: a DNS name that never resolves

Also in the KongTuke capture, the host queries a name that does not exist. One event per check-in is one DNS query:

```bash
tshark -r 2026-09-11-traffic-analysis-exercise.pcap \
  -Y 'dns.flags.response == 0 && dns.qry.name == "globalcert8618.net"' -T fields -e frame.time_epoch \
  | awk 'NR>1 {printf "%.1f\n", $1-prev} {prev=$1}' | sort -n | uniq -c
```

```output title="Result" source="tshark 4.4.6 + awk, 2026-09-11 exercise"
      7 47.8
      8 48.2
```

Sixteen queries, every one answered NXDOMAIN, alternating between 47.8 and 48.2 seconds. Nothing connects, so this beacon never appears in a connection log. Only DNS shows it.

## Compare with browsing

Run the same method on a legitimate site a user browsed, and you will see intervals spread from milliseconds to minutes with no dominant value. The contrast is the point: a beacon has a **peak**.

## Report it

A beacon finding needs four numbers: the interval (mode), its spread, the number of check-ins, and the first and last times. For example:

> 10.2.28.88 polled 45.131.214[.]85 every 60.1–60.3 s (260 of 263 intervals), 264 requests from 19:55:51 to 00:16:28 UTC.


