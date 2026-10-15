---
step: 7
title: Test your lab
description: Download the smallest capture inside the VM, check it, unzip it, and open it in Wireshark.
minutes: 10
lastReviewed: '2026-10-15'
exercises: [2026-02-28-netsupport-rat-heartbeat]
topics: [wireshark]
---

This confirms everything works. We use the **2026-02-28** capture because it's the smallest file (about 5 MB).

## 1. Connect the network

In VMware: **VM → Removable Devices → Network Adapter → Connect**.

## 2. Download the capture inside the VM

In Ubuntu, open **Firefox**, go to this site's [Downloads](/downloads) page, and download `2026-02-28-traffic-analysis-exercise.pcap.zip`. It's saved in `~/Downloads`.

> [!NOTE]
> If this site runs on your own computer (`localhost:3000`), `localhost` inside the VM means the VM itself. Use the **Network** address that `npm run dev` or `npm start` printed instead, for example `http://192.168.1.20:3000`.

## 3. Disconnect the network

**VM → Removable Devices → Network Adapter → Disconnect**.

## 4. Check the file

In Terminal:

```bash
cd ~/Downloads
sha256sum 2026-02-28-traffic-analysis-exercise.pcap.zip
```

The result must match the **ZIP file** checksum on the Downloads page (click *Checksums*). If it doesn't, delete the file and download it again.

## 5. Unzip it

The password for every capture is `infected`.

```bash
unzip -P infected 2026-02-28-traffic-analysis-exercise.pcap.zip
```

You get `2026-02-28-traffic-analysis-exercise.pcap` and `README.txt`.

## 6. Open it

```bash
wireshark 2026-02-28-traffic-analysis-exercise.pcap &
```

## Check

- [ ] Wireshark opens the file
- [ ] The status bar at the bottom shows **Packets: 15512**

Your lab is ready. Revert to the `clean` snapshot (Step 6), then pick an exercise.

> [!TROUBLESHOOTING]
> **"incorrect password".** Type `infected` in lowercase with no spaces.
>
> **The site won't load in the VM.** Check that the network is connected and that your computer's firewall allows port 3000.
