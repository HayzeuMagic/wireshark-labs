---
step: 5
title: Isolate the VM
description: Stop files, text, and network traffic from crossing between the VM and your real computer.
minutes: 5
lastReviewed: '2026-10-15'
exercises: []
topics: [digital-forensics]
---

This is the step that makes the lab safe.

## 1. Turn off copy, paste, and drag and drop

In VMware: **VM → Settings… → Options** tab → **Guest Isolation**.

Uncheck both:

- **Enable drag and drop**
- **Enable copy and paste**

## 2. Turn off shared folders

Still in **Options** → **Shared Folders** → choose **Disabled**.

Click **OK**.

## 3. Know how to cut the network

You will keep the network **on** only while downloading a capture, and **off** while analyzing it.

| To | Do this |
| --- | --- |
| Disconnect | **VM → Removable Devices → Network Adapter → Disconnect** |
| Reconnect | **VM → Removable Devices → Network Adapter → Connect** |

## Check

- [ ] Copying text on your computer and pasting it in the VM does nothing
- [ ] After **Disconnect**, `ping -c 1 8.8.8.8` in the VM's Terminal fails
- [ ] After **Connect**, the same command works again

## Lab rules

Follow these every time:

1. Download and open captures **only inside the VM**.
2. Disconnect the network before opening a capture.
3. **Never** run or double-click files exported from a capture.
4. **Never** visit websites or IPs you find in a capture.
