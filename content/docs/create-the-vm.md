---
step: 2
title: Create the virtual machine
description: Download Ubuntu and create an empty VM with the right memory, processors, and disk.
minutes: 10
lastReviewed: '2026-10-15'
exercises: []
topics: [digital-forensics]
---

The VM runs **Ubuntu Linux**. We use Linux on purpose: the malware in the captures is built for Windows, so it **cannot run** on Ubuntu, even by accident.

## 1. Download Ubuntu

Download the **Ubuntu Desktop 24.04 LTS** ISO file from [ubuntu.com/download/desktop](https://ubuntu.com/download/desktop). It's about 6 GB.

## 2. Start the New Virtual Machine wizard

In VMware: **File → New Virtual Machine…** → choose **Typical** → **Next**.

## 3. Pick the installer

Choose **I will install the operating system later** → **Next**.

This avoids VMware's automatic install so you can follow the normal Ubuntu installer in Step 3.

## 4. Choose the OS type

- Guest operating system: **Linux**
- Version: **Ubuntu 64-bit**

Click **Next**.

## 5. Name it

- Virtual machine name: `rivan-lab`

Click **Next**.

## 6. Set the disk

- Maximum disk size: **40 GB**
- Choose **Store virtual disk as a single file**

Click **Next**.

## 7. Set memory, processors, and the ISO

Click **Customize Hardware…** and set:

| Device | Setting |
| --- | --- |
| Memory | 4096 MB |
| Processors | 2 |
| New CD/DVD | **Use ISO image file** → browse to the Ubuntu ISO |
| Network Adapter | NAT |

Click **Close**, then **Finish**.

## Check

- [ ] `rivan-lab` appears in VMware's library on the left
- [ ] Its summary shows 4 GB memory, 2 processors, and a 40 GB disk
