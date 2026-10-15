---
title: 'Five fields in five filters: identifying an infected Windows host'
description: IP, MAC, host name, account, and full name — where each one lives in a Windows domain capture, and what to do when a source is missing.
date: '2026-10-15'
topics: [infected-host-identification, active-directory, wireshark]
exercises: [2026-02-28-netsupport-rat-heartbeat, 2026-01-31-lumma-stealer-fake-file-share, 2026-09-11-kongtuke-clickfix-chain, 2026-10-01-exe-over-port-9000-and-rat-c2]
docs: []
references:
  - title: Wireshark display filter reference
    href: https://www.wireshark.org/docs/dfref/
  - title: 'RFC 2132: DHCP Options (Option 12, Host Name)'
    href: https://www.rfc-editor.org/rfc/rfc2132
  - title: 'MS-SAMR: Security Account Manager Remote Protocol'
    href: https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-samr/
---

Every incident report on a Windows client starts with the same five facts. Responders need them to find the machine and talk to its user. This tutorial shows where each one lives in a capture from an Active Directory network, using all five Rivan exercises as test cases.

## The five fields

| Field | Best source | Display filter |
| --- | --- | --- |
| IP address | The connection to the alerted server | `ip.addr == <alerted IP>` |
| MAC address | Ethernet header of the client's own broadcast | `dhcp.option.hostname` |
| Host name | DHCP, NBNS, or BROWSER | `dhcp.option.hostname \|\| nbns.flags.opcode == 5 \|\| browser.response_computer_name` |
| Account name | Kerberos client principal | `kerberos.CNameString && !(kerberos.CNameString contains "$")` |
| Full name | SAMR user info from the DC | `samr.samr_UserInfo21.full_name` |

## 1. IP address: pivot from the alert

Alerts give you an external address. Filter on it and read the internal side:

```wireshark
ip.addr == 45.131.214.85
```

Use **Statistics → Conversations → IPv4** with *Limit to display filter* to see the answer as a single row instead of scrolling.

## 2. MAC address: read it from a broadcast the client sent

The MAC is the **Ethernet source** of a frame the client sent on the local segment. DHCP is ideal because the same frame also carries the host name and the requested IP.

```wireshark
dhcp.option.hostname
```

> [!WARNING]
> Do not read the MAC from traffic to the internet. On the client's segment, outbound packets carry the client's MAC as the source; inbound packets from the internet carry the **gateway's** MAC as the source. Mixing them up is the most common wrong answer.

## 3. Host name: three places to look

Windows announces its name in several ways. Check them in this order:

```wireshark
dhcp.option.hostname
```

```wireshark
nbns.flags.opcode == 5
```

NBNS opcode 5 is a name **registration**. Names ending `<00>` and `<20>` are the workstation and server services of the host itself; `<1d>` and `<1e>` names belong to the domain or workgroup.

```wireshark
browser.response_computer_name
```

The Windows BROWSER protocol (over SMB mailslots) carries host announcements. In the [KongTuke exercise](/exercises/2026-09-11-kongtuke-clickfix-chain) there is no DHCP and no NBNS registration for the host, and this filter is the quickest way to the name.

## 4. Account name: Kerberos

Domain logons use Kerberos, and the AS-REQ carries the client principal name in clear text:

```wireshark
kerberos.CNameString && !(kerberos.CNameString contains "$")
```

Names ending in `$` are **machine accounts** (`DESKTOP-5NLV63K$`) and must be excluded. What remains is the user. Right-click the field and **Apply as Column** to keep it visible.

> [!TIP]
> If several users appear, use `ip.src` or `ip.dst` to tie each account to its host. In the [FormBook/XLoader exercise](/exercises/2026-08-09-formbook-xloader-c2-rotation), `rvance` belongs to 172.16.8.49 and `mhanson` to 172.16.8.53.

## 5. Full name: SAMR

After logon, Windows often asks the domain controller for the user's account details over SAMR (inside SMB2). The response includes the display name:

```wireshark
samr.samr_UserInfo21.full_name
```

If you do not remember the field, **Edit → Find Packet**, search **Packet details** for a **String**, and enter the likely last name from the account (for example `Wyatt` for `gwyatt`).

## How the sources held up across the lab

Each row below was checked against the exercise capture with tshark 4.4.6.

| Exercise | DHCP host name | NBNS registration | BROWSER | Kerberos user | SAMR full name |
| --- | --- | --- | --- | --- | --- |
| [2026-01-31](/exercises/2026-01-31-lumma-stealer-fake-file-share) | Yes | Yes | Yes | gwyatt | Gabriel Wyatt |
| [2026-02-28](/exercises/2026-02-28-netsupport-rat-heartbeat) | Yes | Yes | Yes | brolf | Becka Rolf |
| [2026-08-09](/exercises/2026-08-09-formbook-xloader-c2-rotation) | Yes | Yes | Yes | rvance, mhanson | Raymond Vance, Margaret Hanson |
| [2026-09-11](/exercises/2026-09-11-kongtuke-clickfix-chain) | No | No | Yes | gmcdowell | Gabriel McDowell |
| [2026-10-01](/exercises/2026-10-01-exe-over-port-9000-and-rat-c2) | Yes | Yes | Yes | bdiaz | **Not present** |

The lesson of the last row: when a source is missing, the right answer is "not present in the capture", not a guess from the account name.

## Automate it

Practice on the [NetSupport exercise](/exercises/2026-02-28-netsupport-rat-heartbeat) first: one client, every source present, and everything in cleartext.
