---
step: 6
title: Take a clean snapshot
description: Save the VM's clean state so you can wipe it after every exercise in one click.
minutes: 5
lastReviewed: '2026-10-15'
exercises: []
topics: [digital-forensics]
---

A snapshot is a saved copy of the whole VM. Restoring it deletes everything that happened after it was taken, including any malware files.

## 1. Shut down Ubuntu

In Ubuntu, click the power icon at the top right → **Power Off**.

## 2. Take the snapshot

In VMware: **VM → Snapshot → Take Snapshot…**

- Name: `clean`
- Description: `Ubuntu + Wireshark, isolated, no captures`

Click **Take Snapshot**.

## 3. Learn how to restore it

After each exercise:

**VM → Snapshot → Revert to Snapshot: clean** → **Yes**.

To see all snapshots, use **VM → Snapshot → Snapshot Manager**.

## Check

- [ ] **VM → Snapshot → Snapshot Manager** shows a snapshot named `clean`
