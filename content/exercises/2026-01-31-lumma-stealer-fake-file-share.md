## Step 1: Pivot from the alert to the internal host

The alert gives you one external address, 153.92.1[.]49. Start there and let the capture tell you who talked to it.

```wireshark
ip.addr == 153.92.1.49
```

Open **Statistics → Conversations → IPv4** with *Limit to display filter* checked. There is exactly one conversation:

```output title="Conversations, IPv4" source="tshark 4.4.6 -z conv,ip,ip.addr==153.92.1.49"
10.1.21.58  <-> 153.92.1.49   1229 150 kB   1739 2195 kB   2968 2345 kB   92.344626000   30.2069
```

The infected client is **10.1.21.58**. Everything else in this walkthrough is about putting a name, a MAC address, and a person on that IP.

## Step 2: Host name and MAC address

Windows clients announce their host name in DHCP and NetBIOS. Filter for DHCP host names:

```wireshark
dhcp.option.hostname
```

Frame 3 is a DHCP Request. Expand **Dynamic Host Configuration Protocol → Option (12) Host Name** to read `DESKTOP-ES9F3ML`, and **Option (50) Requested IP Address** to read `10.1.21.58`. The **Ethernet II → Source** field of the same frame is the MAC address: `00:21:5d:c8:0e:f2`.

Cross-check with NetBIOS name registrations:

```wireshark
nbns && ip.src == 10.1.21.58
```

Frame 42 registers `DESKTOP-ES9F3ML<20>`. You will also see registrations from `169.254.227.202` with the same MAC. That is the APIPA address Windows used for a moment before DHCP completed; it is the same machine.

## Step 3: The user account name

Kerberos authentication carries the client principal name. Machine accounts end with `$`, so exclude them:

```wireshark
kerberos.CNameString && !(kerberos.CNameString contains "$")
```

Frame 214 is an AS-REQ from 10.1.21.58 to the domain controller at 10.1.21.2. Expand **Kerberos → as-req → req-body → cname → cname-string** to find `gwyatt`.

> [!TIP]
> Right-click the CNameString field and choose **Apply as Column**. You will reuse this column in every Windows-client exercise.

## Step 4: The user's full name

When a domain user logs on, the client often asks the DC for account details over SAMR, and the response includes the display name:

```wireshark
samr.samr_UserInfo21.full_name
```

Frame 358 (SAMR QueryUserInfo response) contains **Full Name: Gabriel Wyatt**. If you cannot remember the field name, **Edit → Find Packet**, set the search to *Packet details* and *String*, and search for the last name inferred from the account, `Wyatt`.

## Step 5: Confirm the Lumma Stealer check-in

Now verify the alert itself. The traffic to 153.92.1.49 on port 80 is cleartext HTTP:

```wireshark
http.request && ip.dst == 153.92.1.49
```

```output title="HTTP requests to the alerted IP" source="tshark 4.4.6, frame / time (UTC) / method / host / URI"
24500  23:05:39.253  GET   whitepepper.su  /api/set_agent?id=3BF67EC05320C5729578BE4C0ADF174C&token=842e2802df0f0a06b4ed51f12f4387e761523b&description=&agent=Chrome
24601  23:05:40.196  POST  whitepepper.su  /api/set_agent?id=3BF67EC05320C5729578BE4C0ADF174C&token=842e2802df0f0a06b4ed51f12f4387e761523b&description=&agent=Chrome&act=log
24614  23:05:40.393  GET   whitepepper.su  /favicon.ico
25270  23:05:47.099  GET   whitepepper.su  /api/set_agent?id=3BF67EC05320C5729578BE4C0ADF174C&token=842e2802df0f0a06b4ed51f12f4387e761523b&description=&agent=Edge
25286  23:05:47.463  POST  whitepepper.su  /api/set_agent?id=3BF67EC05320C5729578BE4C0ADF174C&token=842e2802df0f0a06b4ed51f12f4387e761523b&description=&agent=Edge&act=log
25298  23:05:47.689  GET   whitepepper.su  /favicon.ico
```

Three details are worth writing down:

- The **Host header is `whitepepper.su`**. That answers the alert question.
- The same `id` and `token` appear for both `agent=Chrome` and `agent=Edge`. Each request carries the matching browser's real User-Agent string, and each is followed by a `/favicon.ico` request. That pattern suggests the URL was opened in each browser in turn.
- The POST bodies (follow the stream on frame 24601) begin with `timestamp=` and a URL-encoded `system=` JSON object describing the platform and user agent: the "victim fingerprinting" the signature is named after.

## Step 6: Work backwards to the delivery

An infection that checks in at 23:05:39 started earlier. Build a timeline of TLS server names:

```bash
tshark -r 2026-01-31-traffic-analysis-exercise.pcap -Y "tls.handshake.type == 1" \
  -T fields -e frame.time_utc -e ip.dst -e tls.handshake.extensions_server_name
```

Most entries are Microsoft and Google services. A few are not:

```output title="Selected Client Hello server names" source="tshark 4.4.6, first occurrence of each name"
23:04:44.605  192.178.220.102  drive.google.com
23:04:49.887  104.21.48.156    media.megafilehub4.lat
23:04:52.308  104.21.46.67     cloudflare-ech.com
23:05:34.457  62.72.32.156     whooptm.cyou
23:05:36.432  153.92.1.49      whitepepper.su
```

The `cloudflare-ech.com` entry is not a real destination. It is the *outer* SNI used by **Encrypted Client Hello**, which hides the real server name. To recover it, look at the DNS answer that pointed the client at 104.21.46.67 just before:

```wireshark
dns.a == 104.21.46.67
```

Frame 2774, 35 ms before the Client Hello, resolves **arch.filemegahab4[.]sbs** to 104.21.46.67. Statistics → Conversations → TCP shows that session delivered **about 16 MB to the client in 22 seconds**. The sequence Google Drive → look-alike file-hosting domains → large download → Lumma check-in 47 seconds later is the most likely delivery path.

> [!NOTE]
> The download was encrypted, so its contents and hash are not recoverable from this capture. Say so in your report rather than guessing at a file name.

## Step 7: Look forward from the check-in

```wireshark
tls.handshake.extensions_server_name contains ".cc"
```

Within a minute of the check-in, the host opens HTTPS sessions to **holiday-forever[.]cc** (80.97.160.24, frame 27839) and **communicationfirewall-security[.]cc** (104.21.9.36, frame 28013). These follow-up contacts are typical of stealer infections that pull additional payloads, but the encrypted content cannot confirm that. Record them as suspicious, with the timing as your evidence.

## What goes in the report

- Victim: 10.1.21.58, `00:21:5d:c8:0e:f2`, DESKTOP-ES9F3ML, gwyatt (Gabriel Wyatt).
- Lumma Stealer C2: whitepepper[.]su on 153.92.1[.]49:80, first check-in 23:05:39 UTC.
- Probable delivery: ~16 MB from arch.filemegahab4[.]sbs at 23:04:52 UTC after visits to look-alike file-hosting pages.
- Follow-up: two .cc domains at 23:06:06 and 23:06:10 UTC.
- Limits: the download and follow-up traffic are encrypted.
