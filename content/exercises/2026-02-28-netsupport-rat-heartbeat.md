## Step 1: Find the internal host behind the alerts

```wireshark
ip.addr == 45.131.214.85
```

**Statistics → Conversations → TCP** shows a single connection: `10.2.28.88:51912 ↔ 45.131.214.85:443`, 550 frames, lasting **15,637 seconds** (about 4 hours 20 minutes). One long-lived TCP connection to the same server is already a strong C2 indicator.

## Step 2: Notice what is (and is not) on port 443

Look at the Protocol column for that conversation. Wireshark does not show TLS. It shows **HTTP**, because the payload starts with a plain-text request line:

```output title="Follow TCP Stream (tcp.stream eq 40), first exchange" source="tshark 4.4.6 -z follow,tcp,ascii,40"
POST http://45.131.214.85/fakeurl.htm HTTP/1.1
User-Agent: NetSupport Manager/1.3
Content-Type: application/x-www-form-urlencoded
Content-Length:    22
Host: 45.131.214.85
Connection: Keep-Alive

CMD=POLL
INFO=1
ACK=1

HTTP/1.1 200 OK
Server: NetSupport Gateway/1.92 (Windows NT)
Content-Type: application/x-www-form-urlencoded
Content-Length:    69
Connection: Keep-Alive

CMD=ENCD
ES=1
DATA=.g+$.{.. \....W..[R..7).^\..d8.=M`s.........M.6..
```

Everything you need to name the software is here:

- `User-Agent: NetSupport Manager/1.3` and `Server: NetSupport Gateway/1.92` identify the NetSupport remote-administration product.
- The request uses an **absolute URI** (`POST http://45.131.214.85/fakeurl.htm`), the style a client uses when talking to a proxy or gateway.
- `CMD=ENCD` with a binary `DATA=` field shows that the actual commands are encrypted by NetSupport itself, even though the transport is not.

> [!IMPORTANT]
> Cleartext HTTP on TCP 443 is worth a line in any report on its own. Legitimate software almost never does it, and it bypasses controls that assume port 443 means TLS.

## Step 3: Measure the beacon

Export the request timestamps and subtract each from the next:

```bash
tshark -r 2026-02-28-traffic-analysis-exercise.pcap \
  -Y 'http.request && ip.dst==45.131.214.85' -T fields -e frame.time_epoch \
  | awk 'NR>1 {printf "%.1f\n", $1-prev} {prev=$1}' | sort -n | uniq -c | sort -rn
```

```output title="Interval histogram (seconds)" source="tshark 4.4.6 + awk, 2026-02-28 capture"
    137 60.1
     87 60.2
     36 60.3
      1 0.4
      1 0.2
      1 0.1
```

After a burst of four requests during the initial handshake, the client polls **every 60.1 to 60.3 seconds**: 264 requests in total, the last at 00:16:28 UTC on 2026-03-01. Jitter of 0.2 seconds is machine timing, not a person.

## Step 4: Identify the host and user

The same three filters you use in every Windows exercise:

```wireshark
dhcp.option.hostname == "DESKTOP-TEYQ2NR"
```

Frame 2 (DHCP Request) gives host name **DESKTOP-TEYQ2NR**, requested IP 10.2.28.88, and Ethernet source **00:19:d1:b2:4d:ad**.

```wireshark
kerberos.CNameString && !(kerberos.CNameString contains "$")
```

Frame 243 gives the account **brolf**.

```wireshark
samr.samr_UserInfo21.full_name
```

Frame 339 gives the full name **Becka Rolf**.

> [!NOTE]
> Frame 1 is a lone DHCP Discover with host name `brads-MBP` from a different MAC (`00:e0:4c:68:08:00`). That MAC sends nothing else in the capture. Mention it only to show you ruled it out.

## What goes in the report

- Victim: 10.2.28.88, `00:19:d1:b2:4d:ad`, DESKTOP-TEYQ2NR, brolf (Becka Rolf).
- NetSupport Manager RAT polling `hxxp://45.131.214[.]85/fakeurl.htm` over TCP 443 in cleartext, every ~60 s, from 19:55:51 UTC to at least 00:16:28 UTC.
- The capture starts after installation, so delivery is out of scope.
