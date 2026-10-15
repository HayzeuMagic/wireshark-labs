---
step: 3
title: Install Ubuntu
description: Start the VM and install Ubuntu with the default options.
minutes: 20
lastReviewed: '2026-10-15'
exercises: []
topics: [digital-forensics]
---

## 1. Power on the VM

Select `rivan-lab` and click **Power on this virtual machine**. Click inside the VM window to use the keyboard and mouse there. Press **Ctrl+Alt** to release them back to your computer.

## 2. Start the installer

Choose **Try or Install Ubuntu** and press **Enter**. When the desktop loads, follow the installer:

| Screen | Choose |
| --- | --- |
| Language, accessibility, keyboard | Your preferences |
| Internet connection | Use wired connection |
| What do you want to do? | **Install Ubuntu** |
| Installation type | **Interactive installation** |
| Applications | **Default selection** |
| Disk setup | **Erase disk and install Ubuntu** |
| Your account | Your name, a username, and a password you'll remember |

> [!NOTE]
> "Erase disk" only erases the VM's empty 40 GB virtual disk. Your real computer is not touched.

Click **Install** and wait about 10 minutes.

## 3. Restart

Click **Restart now**. If you see *"Please remove the installation medium"*, press **Enter**.

## 4. Log in and update

Log in, then open **Terminal** (click the grid icon at the bottom left and search *Terminal*). Run:

```bash
sudo apt update && sudo apt upgrade -y
```

Enter your password when asked. Nothing appears while you type it; that's normal.

## 5. Make the screen fit the window (optional)

```bash
sudo apt install -y open-vm-tools-desktop
sudo reboot
```

After the reboot, the Ubuntu screen resizes with the VMware window.

## Check

- [ ] You can log in to Ubuntu
- [ ] `sudo apt update` finishes without errors
