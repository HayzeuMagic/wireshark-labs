# Rivan Cybersecurity Lab

Learn to investigate real malware traffic in Wireshark. The site has five exercises with verified answers, a step-by-step VMware lab setup guide, and password-protected capture downloads.

Built with Next.js 15, React 19, and Tailwind CSS 3.

> [!CAUTION]
> The exercise captures contain **real malware traffic**. Open them only inside the isolated VM described in [Part 2](#part-2-set-up-your-lab-vm). Never run files exported from a capture.

**Contents**

- [Part 1: Run the website](#part-1-run-the-website)
- [Part 2: Set up your lab VM](#part-2-set-up-your-lab-vm)
- [Part 3: Do your first exercise](#part-3-do-your-first-exercise)
- [For developers](#for-developers)

---

## Part 1: Run the website

Do this on your own computer (the host), not inside the VM.

### 1. Install the requirements

| Tool | Version | Download |
| --- | --- | --- |
| Node.js | 22.2 or newer | [nodejs.org](https://nodejs.org/) (choose the LTS version) |
| Git | Any recent version | [git-scm.com](https://git-scm.com/downloads) |

Check them:

```bash
node -v    # v22.2.0 or higher
git --version
```

### 2. Download the project

```bash
git clone https://github.com/HayzeuMagic/wireshark-labs.git
cd wireshark-labs
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the site

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

The terminal also prints a **Network** address, for example `http://192.168.1.20:3000`. Write it down: the lab VM uses that address to reach the site, because `localhost` inside the VM means the VM itself.

> [!TIP]
> For a faster, production version of the site, run `npm run build` and then `npm start` instead of `npm run dev`.

---

## Part 2: Set up your lab VM

You do this once. It takes about 70 minutes. The same steps are on the site at **http://localhost:3000/docs**.

**You need:** a computer with at least 8 GB of RAM and 40 GB of free disk space.

### Step 1: Install VMware Workstation

1. Download **VMware Workstation Pro** (free for personal use) from the [VMware Workstation page](https://www.vmware.com/products/desktop-hypervisor/workstation-and-fusion). Broadcom's download portal asks you to create a free account. On a Mac, use **VMware Fusion** instead.
2. Run the installer with the default options. Restart if asked.
3. Open VMware and choose **Use VMware Workstation Pro for Personal Use**.

✅ **Check:** VMware opens to its home screen.

If VMs won't start, turn on virtualization (Intel VT-x or AMD-V) in your BIOS/UEFI settings.

### Step 2: Create the virtual machine

1. Download the **Ubuntu Desktop 24.04 LTS** ISO from [ubuntu.com/download/desktop](https://ubuntu.com/download/desktop).
2. In VMware: **File → New Virtual Machine… → Typical → Next**.
3. Choose **I will install the operating system later → Next**.
4. Guest OS: **Linux**. Version: **Ubuntu 64-bit → Next**.
5. Name: `rivan-lab` → **Next**.
6. Disk: **40 GB**, **Store virtual disk as a single file → Next**.
7. Click **Customize Hardware…** and set:

   | Device | Setting |
   | --- | --- |
   | Memory | 4096 MB |
   | Processors | 2 |
   | New CD/DVD | **Use ISO image file** → the Ubuntu ISO |
   | Network Adapter | NAT |

8. Click **Close → Finish**.

✅ **Check:** `rivan-lab` appears in VMware's library.

We use Linux on purpose: the malware in the captures is built for Windows, so it cannot run on Ubuntu.

### Step 3: Install Ubuntu

1. Select `rivan-lab` → **Power on this virtual machine**. (Press **Ctrl+Alt** to release the mouse back to your computer.)
2. Choose **Try or Install Ubuntu** and follow the installer:

   | Screen | Choose |
   | --- | --- |
   | What do you want to do? | Install Ubuntu |
   | Installation type | Interactive installation |
   | Applications | Default selection |
   | Disk setup | Erase disk and install Ubuntu (only erases the VM's virtual disk) |
   | Your account | Your name, username, and password |

3. Click **Install**, then **Restart now**. If asked to remove the installation medium, press **Enter**.
4. Log in, open **Terminal**, and update:

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

5. Optional, so the screen resizes with the window:

   ```bash
   sudo apt install -y open-vm-tools-desktop
   sudo reboot
   ```

✅ **Check:** you can log in, and `sudo apt update` finishes without errors.

### Step 4: Install Wireshark

In the VM's Terminal:

```bash
sudo apt install -y wireshark tshark unzip
```

When asked *"Should non-superusers be able to capture packets?"*, choose **No**. You only open files; you never capture live traffic.

```bash
tshark -v
```

✅ **Check:** the first line starts with `TShark (Wireshark) 4.`.

### Step 5: Isolate the VM

1. In VMware: **VM → Settings… → Options → Guest Isolation**. Uncheck **Enable drag and drop** and **Enable copy and paste**.
2. Still in **Options → Shared Folders**, choose **Disabled**. Click **OK**.
3. Learn how to cut the network:

   | To | Do this |
   | --- | --- |
   | Disconnect | **VM → Removable Devices → Network Adapter → Disconnect** |
   | Reconnect | **VM → Removable Devices → Network Adapter → Connect** |

✅ **Check:** after disconnecting, `ping -c 1 8.8.8.8` in the VM fails; after reconnecting, it works.

### Step 6: Take a clean snapshot

1. Shut down Ubuntu (power icon at the top right → **Power Off**).
2. In VMware: **VM → Snapshot → Take Snapshot…** → name it `clean` → **Take Snapshot**.
3. After each exercise, wipe the VM with **VM → Snapshot → Revert to Snapshot: clean**.

✅ **Check:** **VM → Snapshot → Snapshot Manager** shows `clean`.

### Step 7: Test your lab

1. Connect the VM's network (**VM → Removable Devices → Network Adapter → Connect**).
2. In the VM, open Firefox and go to the site's **Network** address from Part 1, step 4 (for example `http://192.168.1.20:3000/downloads`).
3. Download `2026-02-28-traffic-analysis-exercise.pcap.zip`, the smallest capture.
4. **Disconnect** the VM's network.
5. Check the file. The result must match the **ZIP file** checksum on the Downloads page (click *Checksums*):

   ```bash
   cd ~/Downloads
   sha256sum 2026-02-28-traffic-analysis-exercise.pcap.zip
   ```

6. Unzip it. The password for every capture is `infected`:

   ```bash
   unzip -P infected 2026-02-28-traffic-analysis-exercise.pcap.zip
   ```

7. Open it:

   ```bash
   wireshark 2026-02-28-traffic-analysis-exercise.pcap &
   ```

✅ **Check:** the Wireshark status bar shows **Packets: 15512**. Your lab is ready.

If the site won't load in the VM, make sure the VM's network is connected and your computer's firewall allows port 3000.

### Lab rules

1. Download and open captures **only inside the VM**.
2. Disconnect the VM's network before opening a capture.
3. **Never** run or double-click files exported from a capture.
4. **Never** visit websites or IPs you find in a capture.
5. Revert to the `clean` snapshot after every exercise.

---

## Part 3: Do your first exercise

1. Open **http://localhost:3000/exercises** and pick an exercise. Start with **NetSupport Manager RAT heartbeat on TCP 443** (Beginner).
2. Read the scenario and questions, and download the capture inside the VM.
3. Use the hints if you get stuck. They are revealed one at a time.
4. Check your answers in the exercise's **Answer report**.
5. Revert the VM to `clean`.

Suggested order:

| # | Exercise | Level |
| --- | --- | --- |
| 1 | NetSupport Manager RAT heartbeat on TCP 443 | Beginner |
| 2 | Lumma Stealer check-in after a fake file-share download | Beginner |
| 3 | FormBook/XLoader C2 rotation across fifteen domains | Intermediate |
| 4 | EXE download over TCP 9000 and a custom-protocol RAT | Intermediate |
| 5 | KongTuke ClickFix chain from a compromised site to HTTP C2 | Advanced |

---

## For developers

### Project layout

| Path | Contents |
| --- | --- |
| `src/app/` | Routes: `/`, `/docs`, `/exercises`, `/exercises/[slug]`, `/exercises/[slug]/answers`, `/answers`, `/downloads`, `/tutorials`, `/archive`, `/topics`, `/search`, `/about`, `/safety`, 404 |
| `content/docs/*.md` | The lab setup guide. Each file is one step; front matter `step` sets the order |
| `content/tutorials/*.md` | Tutorials |
| `content/exercises/<slug>.md` | Walkthrough for each exercise |
| `src/content/exercises.ts` | Exercise data: questions, answers, evidence, IOCs. Every value reproduced from the PCAP with tshark |
| `src/content/downloads.ts` | Download registry: one password-protected capture per exercise |
| `src/generated/downloads-manifest.json` | Sizes and SHA-256s calculated from the real files |
| `public/downloads/files/` | The published ZIP archives |

### Downloads

The raw `.pcap` files are **not** in this repository, because they are unencrypted malware traffic. Only the password-protected ZIPs in `public/downloads/files/` are committed.

- `npm run downloads:verify` runs automatically before `npm run build` and fails the build if an archive is missing or changed. It works without the raw captures.
- To rebuild an archive, place the raw capture at `<date>-traffic-analysis-exercise.pcap/<date>-traffic-analysis-exercise.pcap` and run `npm run downloads:build -- --force`. Archives use ZipCrypto with the password `infected`, and the output is deterministic.

### Quality checks

```bash
npm run typecheck
npm run lint
npm run check:filters   # compiles every published Wireshark filter with tshark (needs the raw 2026-02-28 capture)
npm run check:site      # against a running server: checks every page, link, and download checksum
```

### Adding an exercise

1. Add the raw capture folder and register it in `src/content/downloads.ts`.
2. Add an entry to `src/content/exercises.ts` and a walkthrough at `content/exercises/<slug>.md`.
3. Run `npm run downloads:build` and `npm run check:filters`.

Mark answers `verified` only after you have reproduced them from the capture. Otherwise use `awaiting-validation` (the answer page stays unpublished) or `illustrative` (fictional teaching data).

### Deployment

The site is static apart from the Next.js server for headers. The five archives total about 122 MB, so check your host's static file size limits. Set `NEXT_PUBLIC_SITE_URL` for correct sitemap and Open Graph URLs.
