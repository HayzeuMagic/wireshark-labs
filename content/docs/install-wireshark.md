---
step: 4
title: Install Wireshark
description: Install Wireshark and the tools for opening the exercise captures.
minutes: 5
lastReviewed: '2026-10-15'
exercises: []
topics: [wireshark]
---

## 1. Install the tools

In the VM's Terminal, run:

```bash
sudo apt install -y wireshark tshark unzip
```

| Tool | What it's for |
| --- | --- |
| `wireshark` | Opens and analyzes captures |
| `tshark` | Command-line version of Wireshark |
| `unzip` | Extracts the password-protected capture files |

## 2. Answer the capture question

A screen asks *"Should non-superusers be able to capture packets?"*. Choose **No** with the arrow keys and press **Enter**.

You will only open capture files, never capture live traffic.

## 3. Check the version

```bash
tshark -v
```

The first line should start with `TShark (Wireshark) 4.`.

## Check

- [ ] `tshark -v` shows version 4.x
- [ ] **Wireshark** appears when you search the app menu

> [!TROUBLESHOOTING]
> **"Unable to locate package wireshark".** Run `sudo apt update` first, then try again.
