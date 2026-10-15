## Step 1: Inventory the Windows clients

Before chasing alerts, find out who is on the segment. Two filters do most of the work:

```wireshark
dhcp.option.hostname || nbns.flags.opcode == 5
```

```wireshark
kerberos.CNameString && !(kerberos.CNameString contains "$")
```

Build a small table as you go:

| IP | MAC | Host name | Account | Full name (SAMR) |
| --- | --- | --- | --- | --- |
| 172.16.8.49 | 00:12:f0:28:d4:34 | DESKTOP-5NLV63K | rvance | Raymond Vance |
| 172.16.8.53 | 00:1b:21:8f:35:27 | DESKTOP-A8WD4E2 | mhanson | Margaret Hanson |

The full names come from `samr.samr_UserInfo21.full_name`: frame 2947 for 172.16.8.49 and frame 1153 for 172.16.8.53. The domain controller is 172.16.8.8 (FIRSTTOLAST-DC) in the FIRSTTOLAST.TECH realm.

## Step 2: Pivot from the alerts

Pick any alerted IP. Only one internal host talks to it:

```wireshark
ip.addr == 146.59.71.167
```

The source is always **172.16.8.49**. Repeat with the other five alerted IPs and you get the same answer every time.

## Step 3: Rule the second client out

Do not assume; check.

```wireshark
http.request && ip.src == 172.16.8.53
```

Two requests: `www.msftconnecttest.com` (the Windows connectivity check) and `edge.microsoft.com`. No unusual DNS, no traffic to any alerted IP. Write that down as the evidence that 172.16.8.53 was reviewed and found clean.

## Step 4: Enumerate the C2 rotation

**Statistics → HTTP → Requests** groups requests by Host. Alongside Windows Update and certificate traffic you will see a block of unfamiliar hosts. A regular expression isolates them:

```wireshark
http.request && ip.src == 172.16.8.49 && http.request.uri matches "^/[a-z0-9]{4}/"
```

```output title="Requests per C2 host (count, IP, host, path)" source="tshark 4.4.6 + awk, 2026-08-09 capture"
3   172.64.155.76    www.independent.ie          /ujvq/
16  146.59.71.167    www.grinswakebthu.info      /irpw/
16  38.182.168.246   www.taibeinan.cc            /lqjm/
8   45.130.41.161    www.legenda-sochi.com       /8nw8/
8   172.67.162.153   www.titanium303.com         /r7l3/
8   121.54.163.148   www.21207628.shop           /hut9/
8   199.192.27.50    www.kentmediallc.com        /7qex/
8   66.29.149.91     www.earthframe.site         /v2r8/
8   183.90.186.205   www.p3x63q.garden           /ttsm/
8   156.247.51.39    www.z61gqw.beer             /nxc3/
8   172.67.219.130   www.www-bet456.co           /h3j8/
8   81.2.196.19      www.moxom.online            /1l1j/
8   104.21.76.210    www.thvwzs.com              /tza3/
8   104.21.42.23     www.devinnovationhab.team   /rd80/
8   89.110.89.25     www.amlgames.site           /ll40/
```

Fifteen hosts between 02:13:23 and 02:19:48 UTC, a new one roughly every 24 seconds. For most hosts the client sends **seven POSTs to the bare path, then one GET with a `2kn1=` query string**. That GET is what the "FormBook CnC Checkin (GET)" signature matches.

Every request carries the same User-Agent:

```output title="C2 User-Agent" source="tshark 4.4.6, http.user_agent"
Mozilla/5.0 (Windows NT 6.2; rv:39.0) Gecko/20100101 Firefox/39.0
```

Firefox 39 is from 2015 and "Windows NT 6.2" is Windows 8. Neither fits a 2026 domain workstation; the string is hard-coded by the malware.

## Step 5: Check DNS for C2 that never connected

```wireshark
dns.flags.rcode == 3 && ip.dst == 172.16.8.49
```

Among the expected internal misses (`wpad.firsttolast.tech`, LDAP SRV lookups) is **www.vjscloudjsns[.]beer**, which returned NXDOMAIN twice. It belongs to the same rotation but was not registered or had been taken down.

## Step 6: Handle the decoy carefully

The very first alerted IP, 172.64.155.76, is a **Cloudflare** address, and the Host header is **www.independent.ie**, a real Irish news site. The malware sent its request pattern to a legitimate site. FormBook and XLoader are known to mix decoy domains into their C2 lists so defenders cannot tell real C2 from noise by list alone.

> [!WARNING]
> Do not block 172.64.155.76 or other shared CDN addresses: thousands of unrelated sites share them. Block malicious **domains** by name, and list independent.ie as a decoy in your report.

## Step 7: FormBook or XLoader?

The alert names FormBook. The behavior (rotating `www.` hosts, four-character paths, `POST` bursts followed by an encoded `GET` parameter, decoys) also matches XLoader, which is widely documented as FormBook's rebranded successor. From traffic alone, "FormBook/XLoader" is the honest label.

## What goes in the report

- Infected: 172.16.8.49, `00:12:f0:28:d4:34`, DESKTOP-5NLV63K, rvance (Raymond Vance).
- Reviewed and clean: 172.16.8.53, DESKTOP-A8WD4E2, mhanson (Margaret Hanson).
- FormBook/XLoader C2 to 15 hosts on port 80 from 02:13:23 to 02:21:07 UTC; one failed lookup; one decoy.
