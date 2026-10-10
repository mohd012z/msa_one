# MSA One

MSA One is a mobile-first, local-first office and productivity workspace packaged for Android with Capacitor.

## Current build — MSA One 55

- Package version: `55.0.0`
- Android versionCode: `55`
- Android versionName: `55.0`
- Application ID: `com.msa.one.displayfit37`
- APK artifact: `MSA-One-55-APK`
- Capacitor: `7.4.3`
- Node.js: `22+`
- Java: `21`

The Android application ID intentionally remains unchanged so Build 55 updates the existing installed application instead of creating a second app.

## Build 55 focus

Build 55 consolidates the presentation layer while preserving the working document, storage, import/export, native-file, PDF, security, planner-data and local-AI engines.

Key changes:

- one `MSAAppShell` owns normal-page navigation;
- phone navigation is **Home · Files · Create · My Day · AI** by default;
- the fourth destination can be changed to **My Day**, **Tools** or **Library**;
- the center Create control opens a multifunction Action Hub;
- Search Center V2 searches files/metadata, tools, templates, AI presets, calendar entries and direct app actions;
- primary phone interaction targets use a 48 px minimum contract;
- high-frequency controls use a local SVG icon registry instead of relying only on emoji glyphs;
- Planner is integrated as **My Day** and no longer mutates the hidden legacy navigation;
- Home, Files and AI surfaces are shorter and task-first;
- tool cards declare `Available`, `Limited`, `Planned`, `Requires file` or `Desktop companion` instead of implying unfinished features are complete;
- File Compressor is explicitly Planned;
- scanned-document assistance does not claim a built-in OCR recognition engine;
- Office mobile keeps full-page editing, pinch zoom, safe areas and drag-down More Options while using the 48 px control contract.

Scanner V2, a real OCR engine, full local document-content indexing and MyAI/Lola workbench integration are intentionally outside this first Build 55 UI consolidation.

## Free-first core

Core work remains usable without paid APIs or mandatory cloud services:

- local project storage and recovery
- document/spreadsheet/presentation/PDF/Smart HTML workflows
- Android file/folder access
- local import/export and backup
- planner/calendar
- built-in tools, templates and library
- deterministic offline helpers and readable-file AI workflows

Premium infrastructure is prepared but billing remains disabled in Build 55.

## Premium state

`www/premium-config.js` keeps:

- Premium prepared: **yes**
- Premium active: **no**
- Google Play billing: **disabled**
- prepared Billing Library target: `9.1.0`

The normal APK workflow proves that the Google Billing dependency and native Premium billing plugin are absent.

## Update policy

Build 55 keeps remote version-policy support:

- update checks: enabled
- enforcement support: enabled
- network failure mode: fail-open
- published policy: latest `55.0.0`, minimum supported `53.0.0`
- `forceUpdate`: false
- exact-version enforcement: false

## Security

The Android/web hardening layer retains:

- Content Security Policy
- blocked object/plugin loading and base-tag rewriting
- rich-content sanitization
- HTTPS validation for supported external endpoints
- Android cleartext traffic disabled
- Android backup disabled
- WebView file-access restrictions
- mixed-content blocking
- Safe Browsing where supported
- Android network security configuration

Smart HTML preview remains isolated and should not be treated as trusted executable app code.

## Android file and PDF integration

The native bridge supports:

- Android file picker
- folder picker through `ACTION_OPEN_DOCUMENT_TREE`
- persisted folder URI permission
- Downloads integration through `MediaStore.Downloads`
- native PDF viewer path using `PdfRenderer`
- Android system-bar inset bridge into CSS variables

The generated Android project is created during CI and is intentionally not committed.

## Build and test

Run locally:

```bash
npm install --ignore-scripts --no-audit --no-fund
npm test
```

GitHub Actions performs:

1. source syntax and regression contracts;
2. Build 55 shell/action/touch/security verification;
3. dependency install;
4. Capacitor Android generation and sync;
5. Android security/native hardening;
6. versionCode `55` / versionName `55.0` injection;
7. packaged web/native asset verification;
8. `./gradlew lintDebug`;
9. `./gradlew assembleDebug`;
10. upload of `MSA-One-55-APK`.

Open **Actions → Build MSA One APK** to run the workflow manually.

## Dependency reproducibility

A `package-lock.json` is not yet committed. CI therefore uses `npm install`.

Before switching CI to `npm ci`, generate and review a lockfile using Node 22/npm in a network-enabled development environment, commit it, and then change the workflow. Do not fabricate a lockfile manually.

## Repository structure

- `www/` — packaged application UI and engines
- `tests/` — Node regression/contracts
- `native-prep/android/` — native Android bridge source injected during build
- `security-prep/android/` — Android security resources
- `premium-prep/` — dormant Premium/backend/update-policy preparation
- `scripts/` — Android hardening and optional Premium activation helpers
- `docs/superpowers/specs/` — approved architecture/design specifications
- `docs/superpowers/plans/` — task-level implementation plans
- `.github/workflows/build-apk.yml` — APK CI pipeline

## Current engineering priorities

1. Keep the Build 55 unified shell and 48 px touch contract stable on phone and tablet layouts.
2. Keep local drafts/recovery dependable and migration-safe.
3. Preserve Office import/export, native folder access and native PDF behavior.
4. Add a reviewed `package-lock.json` and move CI to `npm ci` in a separate reproducibility change.
5. Continue accessibility, safe-area, portrait/landscape and Android-back regression coverage.
6. Keep Premium/cloud capability modular and separate from the free core.
7. Audit every APK with source tests, Android lint, package/version checks and packaged-asset verification before release.

## Important release rule

A capability is not complete merely because a UI entry exists. It is considered implemented only when the runtime route is real, its limitations are stated truthfully, and the relevant regression/build checks pass.
