---
step: 1
title: Install VMware Workstation
description: Install the free VMware Workstation Pro on your computer. This is the program that runs your lab VM.
minutes: 15
lastReviewed: '2026-10-15'
exercises: []
topics: [digital-forensics]
---

The exercise captures contain **real malware traffic**, so you never open them on your own computer. You open them inside a **virtual machine (VM)**: a separate, isolated computer that runs inside VMware.

**You need:** a Windows or Linux computer with at least **8 GB of RAM** and **40 GB of free disk space**.

## 1. Download VMware Workstation Pro

VMware Workstation Pro is free for personal use. Get it from the [VMware Workstation product page](https://www.vmware.com/products/desktop-hypervisor/workstation-and-fusion). The download is hosted on Broadcom's support portal, which asks you to create a free account.

> [!NOTE]
> On a Mac, download **VMware Fusion** from the same page instead. The steps are the same, but some menu names differ.

## 2. Install it

Run the installer and accept the default options. Restart your computer if asked.

## 3. Open it

Start **VMware Workstation Pro**. When asked about the license, choose **Use VMware Workstation Pro for Personal Use**.

## Check

- [ ] VMware Workstation opens and shows its home screen

> [!TROUBLESHOOTING]
> **"Virtualization is disabled" or VMs won't start.** Turn on virtualization (Intel VT-x or AMD-V) in your computer's BIOS/UEFI settings, then restart.
>
> **VMs are very slow on Windows.** If Hyper-V, WSL 2, or Windows Sandbox is enabled, VMware still works but can run slower. That's fine for this lab.
