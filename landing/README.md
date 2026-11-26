# SMAILWOLF M3 Pro — 3D Liquid Glass Landing Page

A 100% English, interactive 3D scrollytelling & iOS-inspired **Liquid Glass** product showcase for the **SMAILWOLF M3 Pro** clean-room driver (`v3.0.13`, Tauri 2 + Rust + WebHID).

## Highlights

- **3D Interactive Mouse Hero Stage**: Real high-resolution transparent M3 Pro cutouts (`944×1667`) mounted in a multi-plane CSS 3D volumetric rig with pixel-masked Fresnel specular glare, real-time cursor tilt, 4-edition carousel (`Arctic Pearl`, `Oni Crimson`, `Cyber Prism`, `Liquid Hologram`), 720° motion-blur spin swap, pointer-repelled floating 3D Liquid Glass orbs, and rising refractive micro-droplets.
- **iPhone / iOS Liquid Glass Material System**: Dual-rim diagonal Fresnel highlights, inner meniscus caustics, SVG optical refraction filter (`#liquid-refract`), dynamic cursor glare pools, and a condensing floating capsule navbar.
- **Scroll-Driven 3D Dissection Theater**: 121 studio dissection frames (`assets/explode/f001..f121.webp`) rendered flicker-free on `<canvas>` inside a 3D perspective Liquid Glass frame with 4 synchronized hardware callout HUDs (`Kailh Switches`, `PAW3311`, `FR2012A`, `500 mAh Li-Po`).
- **3D Cylindrical Coverflow Skin Vault**: Vertical scroll glides smoothly across all **67 real mouse cutouts** in 3D Coverflow perspective, with category filters and an interactive 3D inspection `<dialog>` (`closedby="any"`) that can equip any skin directly onto the Hero stage.
- **3D Isometric Silicon & HID Architecture**: Interactive 4-layer exploded 3D glass wafer stack visualizing the 64-byte `0xFF01` WebHID frame, `mod 256` checksum, FR2012A MCU, and honest sleep-aware battery simulation.
- **Interactive 3D Driver Studio & Bento Spec Matrix**: Live in-browser interactive driver preview with real-time 64-byte WebHID hex packet synthesis, interactive DPI stage switcher, and live polling-rate vs. battery-runtime calculator.
- **Multi-Platform Release Vault (`v3.0.13`)**: Direct downloads and build links for **Windows x64** (`.setup.exe` & Portable `.zip`), **macOS** (`.dmg` & `.app.zip`), and **Linux amd64** (`.AppImage` & `.deb`).

## Run Locally

```bash
cd landing
python -m http.server 8903 --bind 127.0.0.1
# Open http://127.0.0.1:8903/
```
