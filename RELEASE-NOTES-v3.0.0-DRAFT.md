# SMAILWOLF M3 Pro Driver — v3.0.0-rust (DRAFT release notes)

> DRAFT — for the coordinator to paste into the GitHub Release. Do not publish
> until the Windows CI build (`build-windows.yml`) is green on `main`.

A clean-room remake of the SMAILWOLF M3 Pro mouse driver as a native
Windows desktop app: **Rust + Tauri 2 backend, React frontend**. No kernel
driver, no vendor SDK — the HID protocol was measured from the official app
and reimplemented from scratch.

## What's in this release

- **Native Windows app (Tauri 2 + Rust)** — fast startup, low RAM, no browser
  tab needed. Fixed window **1280×1024** (no resize / no maximize).
- **Full driver UI** — Dashboard (DPI, polling, battery, firmware), DPI
  stages 800–12000, polling 125/250/500/1000 Hz, key remapping, sleep,
  device picker redesign, 60+ skins with real preload + virtualized grid.
- **System tray + iOS-style battery popup** — right-click the tray icon for
  the battery popup (battery bar + %, Open interface, Quit).
- **Battery simulation** — the mouse reports battery only as a coarse
  threshold (no fuel-gauge chip), so the app simulates drain:
  - Model: 500 mAh nominal, 400 mAh usable (0.8 efficiency).
  - Drain: 125 Hz → 3 mA, 250 Hz → 5 mA, 500 Hz → 8 mA, 1000 Hz → 14 mA.
  - Runtime ≈ 400 ÷ drain: ~133 h / 80 h / 50 h / 28.6 h.
  - Charging: rises per the charge formula at a 150 mA charge rate, shows
    "Đang sạc" while plugged in.
  - Persists across restart/reboot — time while the app is closed still
    counts at the last polling rate. Never resets to 100% or 0%.
- **Battery saver (Other)** — locks polling to 125 Hz + moderate DPI;
  battery bar turns yellow while saver is on.
- **20% low-battery warning** — one Windows notification per cycle:
  "Chuột của bạn còn 20% pin, vui lòng sạc pin".
- **Autostart on boot (Other)** — optional, via the system autostart setting.
- **Theme toggle (Uiverse) + dark/light themes**, 3 s loading screen.

## Install

1. Download `SMAILWOLF-M3-Pro-Driver_<version>_x64-setup.exe` below and run it.
   **or** download `SMAILWOLF-M3-Pro-Driver_<version>_x64.zip`, unzip anywhere,
   and run the `.exe` inside (portable, nothing installed).
2. Plug in the mouse (2.4G dongle or wired) and open the app.
3. WebView2 runtime is required — Windows 10/11 normally already has it;
   if it is missing, the installer downloads it for you.

Verify the download with `SHA256SUMS.txt` (SHA-256 hashes of both files).

## Known limits — read before installing

- **Battery % is simulated, not measured.** The mouse has no fuel-gauge
  chip; the red LED is the true indicator (solid red = charging, off = full,
  blinking red = low). Treat the app's % as an estimate.
- **setKeys / macro writes are unproven on real hardware** (read path and
  config write-back are live-proven; key/macro writes are not yet).
- **Bluetooth is unreachable via WebHID** — use the 2.4G dongle or a wired
  connection.
- **The installer is UNSIGNED** — Windows SmartScreen will warn ("Windows
  protected your PC") on first run. Click "More info" → "Run anyway".
  There is no code-signing certificate yet; this is expected, not a virus
  warning about this specific file — verify the SHA-256 hash above matches
  before running.
- **First Windows build** — this is the first release built by CI on
  `windows-latest`; it has never been built or run on a Windows machine
  before this release.

## Source

Source code (`.zip` / `.tar.gz`) is auto-attached by GitHub below.
License: MIT (see `LICENSE` in the repo).
