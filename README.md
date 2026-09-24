# MSA One

MSA One is the user's **MSA Patcher** Android app: a mobile-first, local-first office and productivity workspace packaged with Capacitor.

## Current build — MSA One 54

- Package version: `54.0.0`
- Android versionCode: `54`
- Android versionName: `54.0`
- Application ID: `com.msa.one.displayfit37`
- APK artifact: `MSA-One-54-APK`
- Capacitor: `7.4.3`
- Node.js: `22+`
- Java: `21`

The Android application ID intentionally remains unchanged so Build 54 can update the existing installed application instead of creating a second app.

## Build 54 focus

Build 54 concentrates on Android safe-area reliability and compact mobile workspace behavior:

- Android status/navigation bar insets are exposed to CSS through `--native-safe-top` and `--native-safe-bottom`.
- The WebView avoids double native padding.
- Office **More Options** supports drag/swipe-down dismissal.
- The More Options sheet is limited to `70dvh` so more document content remains visible.
- Files storage is separated into **Device** and **Folder Access** groups.
- Storage rows use consistent app styling instead of browser-native button appearance.
- Native folder access uses Android Storage Access Framework and persisted URI permission.
- Build consistency, Safe UI, security, storage, office, import, library, planner and update-policy contracts are covered by Node tests.

## Free-first core

The current production direction is free-first and local-first.

Core work should remain usable without paid APIs or paid cloud services:

- local project storage and recovery
- document/spreadsheet/presentation/PDF/Smart HTML workflows implemented by the packaged app
- Android file/folder access
- local import/export and backup
- planner/calendar
- built-in tools, templates and library
- deterministic offline helpers
- manual `in_ai` / Lola handoff export and validated result import

Premium infrastructure is prepared but billing is deliberately disabled in Build 54.

## `in_ai` and Lola companion workflow

MSA One treats this repository as the **MSA Patcher** app and integrates with:

- `mohd012z/in_ai` for everyday AI workbench handoffs
- `mohd012z/lola` for companion workflows that stay **desktop-only**

The Android app is intentionally local-first:

- it exports a manual handoff manifest as **JSON** or **Markdown**
- it imports only bounded, schema-validated JSON results
- it renders imported content as escaped text / structured data
- it does **not** auto-upload files, scan the device, expose secrets, or call undocumented services

Only analyze projects you are authorized to inspect.

### Exact manual workflow

1. Open **AI → MSA Patcher companion** or **Tools → in_ai + Lola Companion**.
2. Choose a task kind: `coding`, `office`, `apk-creator`, `development`, or `deep-dive`.
3. Optionally choose one existing MSA project and tick only the metadata you want to share.
4. Paste only the user-selected summary and text excerpts you authorize for transfer.
5. Export either:
   - `*.json` for machine-readable handoff, or
   - `*.md` for a manual desktop/workbench handoff
6. In `mohd012z/in_ai` or `mohd012z/lola`, manually import/paste the manifest and add any separately authorized files yourself.
7. Run the work outside MSA One:
   - `in_ai` may produce **model-assisted** results
   - Lola operations remain **desktop-only**
8. Save the returned companion result as JSON using the interoperability contract in `docs/lola-companion-schema.md`.
9. Back in MSA One, open the companion workflow and choose **Import result JSON**.
10. Import into:
    - an existing document / Smart HTML project, or
    - the local **MSA Patcher Companion Evidence** area

### What is integrated vs desktop-only / planned

Integrated now:

- local manifest creation
- JSON + Markdown export
- bounded validated result import
- safe text/structured rendering
- local evidence persistence and backup/recovery

Desktop-only:

- Lola execution and any desktop companion actions

Planned / intentionally not bundled:

- automatic cloud upload
- hidden device scanning
- undocumented services
- DRM bypass or third-party APK patching

## Premium state

`www/premium-config.js` currently keeps:

- Premium prepared: **yes**
- Premium active: **no**
- Google Play billing: **disabled**
- prepared Billing Library target: `9.1.0`

The normal APK workflow verifies that the Google Billing dependency and native Premium billing plugin are not included.

## Update policy

Build 54 includes a remote version policy:

- update checks: enabled
- enforcement support: enabled
- network failure mode: fail-open
- current published policy: latest `54.0.0`, minimum supported `53.0.0`
- `forceUpdate`: false
- exact-version enforcement: false

The update-policy mount is idempotent so startup cannot create duplicate policy timers/check loops.

## Security

The Android/web hardening layer includes:

- Content Security Policy
- blocked object/plugin loading
- blocked base-tag rewriting
- rich-content sanitization
- HTTPS validation for supported external endpoints
- Android cleartext traffic disabled
- Android backup disabled
- WebView file-access restrictions
- mixed-content blocking
- Safe Browsing where supported
- network security configuration

Smart HTML preview remains isolated and should not be treated as trusted executable app code.

## Android file integration

The native bridge supports:

- Android file picker
- folder picker through `ACTION_OPEN_DOCUMENT_TREE`
- persisted folder URI permission
- Downloads integration through `MediaStore.Downloads`

The generated Android project is created during CI and is intentionally not committed.

## Build and test

Run locally:

```bash
npm install --ignore-scripts --no-audit --no-fund
npm test
```

GitHub Actions workflow:

1. Run source syntax/contracts.
2. Verify Build 54 source/UI/security assumptions.
3. Install dependencies.
4. Generate the Android Capacitor project.
5. Sync the web app.
6. Apply Android security/native hardening.
7. Set Android Build 54 version metadata.
8. Verify packaged assets and native controls.
9. Run `./gradlew lintDebug`.
10. Run `./gradlew assembleDebug`.
11. Upload `MSA-One-54-APK`.

Open **Actions → Build MSA One APK** to run the workflow manually.

## Dependency reproducibility

A `package-lock.json` is not yet committed. CI therefore still uses `npm install`.

Before changing CI to `npm ci`, generate and review a lockfile using Node 22/npm in a network-enabled development environment, commit it, then switch the workflow to `npm ci --ignore-scripts --no-audit --no-fund`.

Do not fabricate a lockfile manually.

## Repository structure

- `www/` — packaged application UI and engines
- `docs/lola-companion-schema.md` — `in_ai` / Lola interoperability contract
- `tests/` — Node regression/contracts
- `native-prep/android/` — native Android bridge source injected during build
- `security-prep/android/` — Android security resources
- `premium-prep/` — dormant Premium/backend/update-policy preparation
- `scripts/` — Android hardening and optional Premium activation helpers
- `.github/workflows/build-apk.yml` — APK CI pipeline

## Current engineering priorities

1. Keep Android safe-area and compact mobile layout stable.
2. Keep local drafts/recovery dependable and migration-safe.
3. Maintain Create / Files / Calendar integration.
4. Add a real reviewed `package-lock.json` and move CI to `npm ci`.
5. Continue accessibility/mobile viewport regression coverage.
6. Keep Premium/cloud capability modular and separate from the free core.
7. Audit every APK with source tests, Android lint, package/version checks and packaged-asset verification before release.

## Important release rule

Do not claim a capability is complete merely because a UI entry or prepared module exists. A feature is considered implemented only when its runtime path, storage/import/export behavior and regression checks are present and verified.
