---
title: Carving and hashing an EXE from HTTP without running it
description: Find an executable in a capture, export it safely, confirm its type and size, calculate its SHA-256, and clean up — in the GUI and on the command line.
date: '2026-10-15'
topics: [file-extraction, digital-forensics, http-analysis]
exercises: [2026-10-01-exe-over-port-9000-and-rat-c2]
docs: []
references:
  - title: 'Wireshark User Guide: Exporting Objects'
    href: https://www.wireshark.org/docs/wsug_html_chunked/ChIOExportSection.html
  - title: 'Microsoft PE format: MS-DOS stub'
    href: https://learn.microsoft.com/en-us/windows/win32/debug/pe-format
---

The [port 9000 exercise](/exercises/2026-10-01-exe-over-port-9000-and-rat-c2) asks for the SHA-256 of a Windows executable downloaded over HTTP. Getting it is easy. Getting it **safely** and **correctly** takes a little discipline.

> [!CAUTION]
> The file is live malware. Do every step below inside an isolated analysis VM, preferably Linux, with networking disabled. Never double-click the exported file.

## 1. Prepare an empty folder

```bash
mkdir -p ~/case/2026-10-01/objects
cd ~/case/2026-10-01
```

An empty, dedicated folder means you know exactly what you exported and can delete all of it afterwards.

## 2. Find the executable

Look for responses whose body starts with the `MZ` header:

```wireshark
http.response && http.file_data[0:2] == 4d:5a
```

```output title="Result" source="tshark 4.4.6, 2026-10-01 exercise"
24916	107.175.82.242	9000	binary/octet-stream	1646592
```

One frame: a 1,646,592-byte response from 107.175.82.242 on port 9000, labeled `binary/octet-stream`. The Content-Type says nothing; the first two bytes say "Windows executable".

## 3. Export it

**In Wireshark:** File → Export Objects → HTTP… → select the row with hostname `107.175.82.242:9000` and filename `runner_ilove.exe` → **Save** into `objects/`.

**With tshark:**

```bash
tshark -r 2026-10-01-traffic-analysis-exercise.pcap -q --export-objects http,objects
ls -la objects/
```

tshark exports every HTTP object, not just the one you want. That is fine in a dedicated folder.

## 4. Confirm size and type

```bash
stat -c '%s %n' objects/runner_ilove.exe
file objects/runner_ilove.exe
```

The size must match the response's Content-Length (1,646,592). If it does not, the capture missed segments and any hash you calculate describes a broken file.

```output title="Result" source="Rivan lab run, 2026-10-15"
runner_ilove.exe: PE32+ executable for MS Windows 6.00 (GUI), x86-64, 8 sections
```

## 5. Hash it

```bash
sha256sum objects/runner_ilove.exe
```

```output title="Result" source="Rivan lab run, 2026-10-15"
b789adce70c028a6d17be45ec34667aa95586350ee0c4057e75b138b1ad35061  objects/runner_ilove.exe
```

On Windows, inside the VM:

```powershell
Get-FileHash -Algorithm SHA256 .\objects\runner_ilove.exe
```

## 6. Record and clean up

Write the hash, size, file type, source URL (defanged), frame number, and capture SHA-256 into your notes. Then:

```bash
rm -rf objects/
```

The hash is all anyone needs to search for the file in EDR, threat intelligence, or reputation services. 

## Common mistakes

- **Exporting on your host.** Endpoint protection deletes or quarantines the file, and sometimes alerts the security team. Work in the VM.
- **Hashing the wrong object.** Export Objects lists every response, including certificate revocation lists and redirects. Match the hostname, filename, and size.
- **Trusting the filename.** The name comes from the URL. The hash is the identity.
- **Uploading the sample without permission.** Many organizations forbid uploading files to public sandboxes. Search by hash first.
