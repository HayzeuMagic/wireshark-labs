## Step 1: Identify the only Windows client

```wireshark
browser.response_computer_name
```

Frame 787 is a BROWSER *Request Announcement* from **10.10.1.128** for **DESKTOP-4VGYQX7**, Ethernet source **00:22:fb:ec:7e:e7**. DHCP (frame 1 onward) agrees.

```wireshark
kerberos.CNameString && !(kerberos.CNameString contains "$")
```

The account is **bdiaz** (NATUREFORCE.COM realm, DC 10.10.1.10).

> [!NOTE]
> `samr.samr_UserInfo21.full_name` returns nothing in this capture. The user's full name is not recorded, so the correct answer is "not determinable from the capture", not a guess based on the account name.

## Step 2: Find the executable download

```wireshark
http.request
```

Sort by destination port. Almost everything is port 80 for certificate revocation lists and Windows checks. One request stands out:

```output title="HTTP request to port 9000" source="tshark 4.4.6, 2026-10-01 capture"
23091  19:30:36.806  10.10.1.128 → 107.175.82.242:9000  GET /wilow/runner_ilove.exe  User-Agent: curl/8.21.0
24916  19:30:38.580  107.175.82.242:9000 → 10.10.1.128  HTTP/1.1 200 OK  binary/octet-stream  Content-Length: 1646592
```

Three red flags in one request: a **bare IP address** instead of a domain, an **unusual port (9000)**, and **curl** as the User-Agent on a Windows workstation. Ninety seconds earlier curl also fetched `/prw` and `/crv` from holtandberyl.com (frames 8235 and 8345), which redirected to HTTPS.

## Step 3: Export and hash the file safely

> [!CAUTION]
> This file is live Windows malware. Export it only inside your isolated analysis VM, into an empty folder, and never execute it.

In Wireshark: **File → Export Objects → HTTP…**, select the row with hostname `107.175.82.242:9000` and filename `runner_ilove.exe`, and **Save**. Or from the command line:

```bash
mkdir -p ~/case/2026-10-01/objects
tshark -r 2026-10-01-traffic-analysis-exercise.pcap -q --export-objects http,~/case/2026-10-01/objects
sha256sum ~/case/2026-10-01/objects/runner_ilove.exe
file ~/case/2026-10-01/objects/runner_ilove.exe
```

```output title="Hash and file type of the exported object" source="Rivan lab run, 2026-10-15 (sha256sum, file)"
b789adce70c028a6d17be45ec34667aa95586350ee0c4057e75b138b1ad35061  runner_ilove.exe
runner_ilove.exe: PE32+ executable for MS Windows 6.00 (GUI), x86-64, 8 sections
```

The exported size is 1,646,592 bytes, matching the `Content-Length`. The first two bytes of the response body are `MZ`, the DOS header every Windows executable starts with. On Windows, use `Get-FileHash .\runner_ilove.exe -Algorithm SHA256`.

Delete the exported file when you have the hash.

## Step 4: Verify the RAT alert

Six seconds after the download completes, a new TCP session begins:

```wireshark
ip.addr == 195.63.128.106
```

Frame 24963 is the SYN to **195.63.128.106:443** at 19:30:44 UTC. The session lasts until 20:07:57, and the server sends about 14 MB to the client.

It uses port 443, but it is not TLS. A TLS session begins with a record header of `0x16 0x03`. The client's first payload here begins with `74 9c 90 db ff ff ff ff …`. Wireshark's heuristics may label some segments "SSL" anyway, which is misleading. Describe it as a **binary, non-TLS protocol on TCP 443**.

```wireshark
tcp.stream eq 130 && tcp.len > 0
```

Stream 130 is the index Wireshark assigns to this session; you can confirm it in the TCP details of frame 24963.

> [!WARNING]
> Some versions of the alert text give the C2 address as 195.64.128.106. The capture contains no packets to that address. Report what the evidence shows, and note the discrepancy so the alert source can be corrected.

## Step 5: What came before curl?

```wireshark
tls.handshake.type == 1 && !(tls.handshake.extensions_server_name contains "google") && !(tls.handshake.extensions_server_name contains "microsoft")
```

At 19:28:30 the browser visited **www.ars-soar.com** and then **sorrelapse[.]best**. Thirty seconds later curl starts working. A user being walked through running a command after visiting a web page is consistent with ClickFix-style lures, but the capture does not show the command, so present it as a hypothesis for the endpoint team to confirm from process logs.

## What goes in the report

- Victim: 10.10.1.128, `00:22:fb:ec:7e:e7`, DESKTOP-4VGYQX7, bdiaz. Full name not present in the capture.
- `runner_ilove.exe`, SHA-256 `b789adce70c028a6d17be45ec34667aa95586350ee0c4057e75b138b1ad35061`, downloaded by curl from `hxxp://107.175.82[.]242:9000/wilow/runner_ilove.exe` at 19:30:36 UTC.
- RAT C2: binary protocol to 195.63.128[.]106:443 from 19:30:44 to 20:07:57 UTC.
