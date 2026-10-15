## Step 1: Identify the host without NBNS

This capture has no DHCP exchange and no NetBIOS registration of the host name, so use the BROWSER protocol instead:

```wireshark
browser.response_computer_name
```

Frame 435 is a *Request Announcement* from **10.9.11.135** naming **DESKTOP-6T17ZFM**; its Ethernet source is **08:d4:0c:7a:29:1e**. The same filter also shows the domain controller, 10.9.11.2, announcing itself as WIN-GTWXC9UYSE4.

```wireshark
kerberos.CNameString && !(kerberos.CNameString contains "$")
```

The account is **gmcdowell** (OVERHANDS.ORG realm).

```wireshark
samr.samr_UserInfo21.full_name
```

Frame 70694 returns **Gabriel McDowell**.

## Step 2: Build the server-name timeline, including QUIC

ClickFix chains are fast and almost entirely encrypted, so the order of server names is your main evidence. Include QUIC: browsers use HTTP/3 whenever a server offers it, and Wireshark can read the SNI from the QUIC Initial packet.

```wireshark
tls.handshake.type == 1 || quic
```

Add `tls.handshake.extensions_server_name` as a column. The first minute of the capture reads like this:

```output title="First contacts by server name" source="tshark 4.4.6, 2026-09-11 capture, first occurrence of each name"
20:05:55.975  104.196.13.170  TLS   quadcinema.com
20:05:56.374  172.67.205.86   QUIC  aatthews.cfd
20:06:33.131  104.21.91.138   TLS   winrun2915.com
20:06:36.166  172.67.214.168  TLS   logincrypt8338.com
20:06:38.553  172.67.180.55   TLS   opscast3707.net
20:06:42.504  172.67.155.32   TLS   www.xos-aploq.com
20:06:46.939  104.21.34.58    TLS   jaw.xos-aploq.com
20:06:47.517  104.16.212.131  TLS   nodejs.org
20:06:52.739  104.21.34.58    TLS   soft.xos-aploq.com
```

Read it as a story:

1. **quadcinema.com** loads. Less than half a second later the browser fetches something from **aatthews[.]cfd** over QUIC. A site that immediately pulls a script from an unrelated, newly registered `.cfd` domain is the signature of a web inject; the scenario attributes it to KongTuke.
2. Thirty-seven seconds pass. That gap fits a user reading a fake "verify you are human" page and following its instructions to paste a command into the Run dialog; the page itself is encrypted, so this step is inferred.
3. In five seconds the host contacts **winrun2915[.]com**, **logincrypt8338[.]com**, and **opscast3707[.]net**. The names alone (`winrun`, `logincrypt`, `opscast`) are typical of throwaway infrastructure. Statistics → Conversations shows **opscast3707.net delivered about 7.5 MB**.
4. Subdomains of **xos-aploq[.]com** follow, and between them a **36 MB download from nodejs.org in under 4 seconds**.

> [!NOTE]
> nodejs.org is legitimate. A 36 MB download from it is consistent with the Node.js runtime, and a later connection to registry.npmjs.org (20:08:59) fits a chain that runs JavaScript payloads with Node. The capture cannot prove what the file was; say "consistent with", not "was".

## Step 3: Find the command-and-control

Ten seconds after soft.xos-aploq.com, cleartext HTTP starts:

```wireshark
http.request && ip.dst == 86.106.87.134
```

```output title="First C2 requests" source="tshark 4.4.6, 2026-09-11 capture"
62434  20:06:57.558  GET   /zgzly/e2fkf6&4a0fd955c05d43841a9a8d921ceec63b0dc5b431a9fb54b33ad7848707bc16e9/o3m8xrq0rab
62493  20:07:16.413  POST  /v/g7mokeaio77&4a0fd955c05d43841a9a8d921ceec63b0dc5b431a9fb54b33ad7848707bc16e9
62519  20:07:25.970  GET   /pffk8chya2/mnwgp53asv8&4a0fd955c05d43841a9a8d921ceec63b0dc5b431a9fb54b33ad7848707bc16e9
```

The Host header is **know.mom-nower[.]com**. Every URI has random path segments wrapped around **an ampersand and a 64-character hex token**. Requests arrive roughly every 10 seconds; 73 go to 86.106.87.134 between 20:06:57 and 20:26:47 UTC. Most replies are `204 No Content` (52) with some `200 OK` (12): the server acknowledging check-ins and occasionally sending data.

At 20:10:03 the token changes from `4a0fd955…bc16e9` to `99099296…dca1ab`. A token change mid-session often means the implant re-registered or switched stages; note it without over-interpreting.

## Step 4: Watch the C2 rotate

From 20:22 onward, the same URI pattern goes to new hosts:

```wireshark
http.request && !(http.host == "know.mom-nower.com") && http.request.uri contains "99099296646b5ffb"
```

Eight new Host values appear: `now.comonto-rsr.com`, `stream.fif-lost.com`, `second.bert-hits.com`, `gets.bert-hits.com`, `firt.comonto-rsr.com`, `start.comonto-rsr.com`, `hyko.fif-lost.com` (four requests each), and `www.bert-hits.com` (two). Most answer `400` or `406`, meaning the fallback servers rejected the requests. Fallback lists like this are why you block by pattern as well as by name.

## Step 5: The C2 that never resolved

```wireshark
dns.qry.name contains "globalcert"
```

Starting at 20:07:08, the host asks for **globalcert8618[.]net** every 48 seconds, and every answer is NXDOMAIN. A domain queried on a fixed interval that never resolves is a beacon waiting for infrastructure. If the domain is ever registered, this host will connect to it. Include it in your block list.

## What goes in the report

- Victim: 10.9.11.135, `08:d4:0c:7a:29:1e`, DESKTOP-6T17ZFM, gmcdowell (Gabriel McDowell).
- Chain: quadcinema.com → aatthews[.]cfd (KongTuke inject, QUIC) → ClickFix domains → opscast3707[.]net (7.5 MB) and nodejs.org (36 MB) → HTTP C2 at know.mom-nower[.]com, then fallback C2 hosts.
- Confidence is High for host identity and C2, Medium for the ClickFix step, which is inferred from sequence and timing.
