# Release checklist — v3.0.0-rust (coordinator)

Workstream D prepared everything below. Do the steps in order; do not skip
the CI gate.

## 0. Preconditions (already done by workstream D)

- [x] `.github/workflows/build-windows.yml` — one job on `windows-latest`,
      Node 24 + `npm ci` + `npm run build` + HID tests + `cargo check` gate +
      `npx tauri build` (NSIS + portable zip) + SHA-256 + artifact upload.
- [x] `src-tauri/tauri.conf.json` — bundle targets `["nsis", "zip"]`,
      `bundle.licenseFile` set to `../LICENSE` (valid Tauri 2 `BundleConfig`
      key; path is relative to `src-tauri/`, so it resolves to the repo-root
      `LICENSE`).
- [x] `.gitignore` — covers `node_modules/`, `dist/`, `src-tauri/target/`,
      `src-tauri/gen/`, `*.log`, `.env` (appended).
- [x] Validated: YAML parses, `tauri.conf.json` is valid JSON,
      `npm run build` passes, HID tests 75/75.
- [x] `RELEASE-NOTES-v3.0.0-DRAFT.md` — paste into the GitHub Release body.

## 1. ⚠️ Version mismatch — decide BEFORE tagging

The app version is still **0.1.0** (`tauri.conf.json` + `src-tauri/Cargo.toml`)
while the release tag will be **v3.0.0-rust**. CI artifacts will therefore be
named `SMAILWOLF-M3-Pro-Driver_0.1.0_x64-setup.exe` /
`SMAILWOLF-M3-Pro-Driver_0.1.0_x64.zip` under a `v3.0.0-rust` tag.

- Recommended: bump the version to `3.0.0` in BOTH `src-tauri/tauri.conf.json`
  (`"version"`) and `src-tauri/Cargo.toml` (`version =`) before the first push,
  so artifact names match the tag. (Keep `package.json` version as-is; it is
  not used for bundle naming.)
- If you skip the bump, update the `<version>` placeholders in the release
  notes draft to `0.1.0` before pasting.

## 2. Push — plain git (NOT the MCP snapshot-push flow)

The documented snapshot-push flow (`github` connector,
`references/snapshot-push.md`) does **NOT** fit this repo: it only accepts
UTF-8 text files, ≤2,000 files / ≤16 MiB, no binaries, no deletions — this
repo has binary assets (`public/skins/`, `public/*.webp`, `src-tauri/icons/*.ico`,
fonts) and is larger than that. Per that doc's own rule, use plain git:

```bash
cd ~/workspace/smailwolf-m3pro/driver-ui
git init -b main
git remote add origin https://github.com/duyzoz/Smail-Wolf-M3-Pro.git
git fetch origin          # check what is already on remote main first
git status --short        # MUST show no dist/, src-tauri/target/, node_modules/
git add -A
git commit -m "SMAILWOLF M3 Pro driver v3.0.0-rust (Tauri 2 + React)"
git push -u origin main
```

Notes:
- Remote `duyzoz/Smail-Wolf-M3-Pro` already exists with a placeholder README
  ("remake driver Smail-Wolf-M3-Pro"). If `git fetch` shows a commit on remote
  main, do NOT force-push blindly: inspect it (`git log origin/main --oneline`),
  then rebase onto it or replace the placeholder README deliberately — the
  local `README.md` is the real driver README and should win.
- Never commit `dist/`, `src-tauri/target/`, or `node_modules/` — `.gitignore`
  covers them; `git status` is the check.

## 3. Wait for CI (the authoritative gate)

- GitHub → repo → Actions → "Build Windows" run on the push to `main`.
- It must be **green end-to-end**, especially the `cargo check` step and the
  `Tauri build` step. The Windows build has never run before — this is the
  first real proof. If it is red, do NOT cut the release; fix and re-push.
- Optional: trigger a re-run any time via Actions → "Build Windows" →
  "Run workflow" (manual dispatch).

## 4. Download artifacts

- From the green run: Artifacts → `smailwolf-m3pro-windows` (one zip).
- It contains exactly these files (names use the app version, currently 0.1.0
  unless step 1's bump was done):
  - `SMAILWOLF-M3-Pro-Driver_<version>_x64-setup.exe` — NSIS installer
  - `SMAILWOLF-M3-Pro-Driver_<version>_x64.zip` — portable build
  - `SHA256SUMS.txt` — SHA-256 hashes of the two files above
- Raw Tauri outputs (for reference, inside the runner, NOT uploaded):
  `src-tauri/target/release/bundle/nsis/*-setup.exe`,
  `src-tauri/target/release/bundle/zip/*.zip`.

## 5. Create the Release

1. GitHub → repo → Releases → "Draft a new release".
2. Tag: `v3.0.0-rust` (create on publish, target `main`). Title: `v3.0.0-rust`.
3. Upload the three files from step 4: the `.setup.exe`, the `.zip`,
   `SHA256SUMS.txt`.
4. Confirm GitHub auto-attached the source archives (`Source code (zip)` and
   `Source code (tar.gz)`) — they appear automatically once the release is
   published from a tag.
5. Paste the body from `RELEASE-NOTES-v3.0.0-DRAFT.md` (replace `<version>`
   with the real artifact version first).
6. Publish.

## 6. After publishing

- Tell Ethan the release URL + the SmartScreen warning (unsigned installer →
  "More info" → "Run anyway", after checking the SHA-256).
- First real-world proof still owed: install the `.setup.exe` on a Windows
  machine and run it against the real mouse (workstream D could not run the
  Windows build in the Linux sandbox — CI is the only gate so far).
