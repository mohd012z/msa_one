# MSA One

MSA One is an all-in-one mobile office workspace for documents, spreadsheets, presentations, PDF, Smart HTML, planning, storage, reusable libraries, contextual help and adaptive performance.

## Current build — MSA One 48

MSA One 48 keeps Android application ID `com.msa.one.displayfit37`, so it updates the existing installation instead of creating a separate app.

## Security Hardened — Build 48

Build 48 adds a central web-content and Android security layer without activating Premium or force-update enforcement.

### Web security

- Content Security Policy is present in the packaged app.
- Remote/plugin object loading is blocked.
- Base-tag rewriting and form submission are blocked.
- Smart HTML preview uses its own isolated CSP with scripts, network connections, forms, frames and objects disabled.
- Stored rich-document HTML is sanitized on load/save.
- Restored document projects are sanitized before storage.
- Personal document templates are sanitized before Library storage.
- JavaScript/event-handler URLs are removed from rich content.
- Remote image loading is blocked in rich documents; local data/blob images remain supported.
- External store/backend URLs must use safe HTTPS.
- Backup size and structure are validated before restore.

The current CSP still permits inline app script/style because legacy inline handlers/styles remain in the main HTML. A future hardening step should move inline code to external modules, remove `unsafe-inline`, then enforce Trusted Types.

### Android security

The generated Android project now runs `scripts/apply-android-security.mjs` after Capacitor sync.

It applies:

- `android:usesCleartextTraffic="false"`
- network security configuration with cleartext disabled
- `android:allowBackup="false"`
- WebView `setAllowFileAccess(false)`
- WebView `setAllowFileAccessFromFileURLs(false)`
- WebView `setAllowUniversalAccessFromFileURLs(false)`
- `MIXED_CONTENT_NEVER_ALLOW`
- geolocation disabled
- Safe Browsing enabled where supported

The normal APK workflow verifies all of those controls before Gradle compilation.

Future Premium activation refuses to proceed unless the hardened MainActivity is already present.

### Security Center

The Built-in Library now exposes a **Security Center** module through `MSALibrary.api('security')`.

It can provide security diagnostics, safe URL checks and rich-document sanitization.

### Security regression coverage

Build 48 tests malicious restored-document HTML, event handlers, JavaScript URLs, personal-template sanitization, invalid/oversized backup handling, Smart HTML preview isolation, CSP presence, Android WebView hardening, cleartext blocking and Premium-off safety.

## Next security priorities

The next recommended work, in order:

1. Commit a `package-lock.json` and change CI from `npm install` to `npm ci`.
2. Trace and update the transitive dependency that currently emits the deprecated `tar@6.2.1` warning.
3. Stage-test Capacitor 7.6.8 before any major-version upgrade; then evaluate the current Capacitor 8.x line separately.
4. Move inline JavaScript/event handlers/styles out of `index.html`, remove CSP `unsafe-inline`, then enable Trusted Types.
5. Add optional AES-GCM encrypted workspace backups with a user passphrase or device-keystore-backed key.
6. Store future authentication/refresh tokens only via Android Keystore-backed native storage, never localStorage.
7. Add authenticated backend sessions, authorization checks, rate limiting, replay protection and audit logging before Premium/cloud features activate.
8. Add Play Integrity validation for high-value server actions such as Premium entitlement and account-sensitive operations.
9. Add dependency vulnerability/signature scanning and secret scanning in CI.
10. Build a signed release/AAB pipeline using GitHub Environments/Secrets and protected release approvals.
11. Add privacy controls: data retention, delete/export account data, telemetry opt-in and redaction of sensitive document content from logs.
12. Add security-focused runtime tests on real Android WebView versions, including malicious DOCX/HTML/backup files and offline/rotation/import scenarios.

## Premium Ready — intentionally NOT active

Build 47 prepares the complete Premium architecture without activating purchases or locking users into an update.

The live configuration in `www/premium-config.js` is deliberately:

- `prepared: true`
- `active: false`
- `billing.enabled: false`
- `updatePolicy.enabled: false`
- `updatePolicy.enforce: false`

The normal GitHub Actions APK build fails if those safety assumptions are violated.

### Prepared Premium layers

- `www/premium-config.js` — one explicit activation configuration
- `www/entitlement-engine.js` — capability-based Free/Premium gating
- `www/premium-ui.js` — Premium status, diagnostics, Restore/Manage hooks and click guarding
- `www/premium.css` — prepared Premium and required-update UI
- `www/version-policy.js` — minimum-version / forced-update / exact-version evaluator
- `premium-prep/android/PremiumBillingPlugin.java` — dormant Capacitor/Google Play Billing native bridge template
- `scripts/activate-premium-android.mjs` — explicit native activation script
- `premium-prep/backend/google-play.mjs` — server-side Google Play verification/acknowledgement helpers
- `premium-prep/backend/schema.sql` — prepared purchase/entitlement schema
- `premium-prep/update-policy.example.json` — remote version-policy example

Google Play Billing preparation targets **Billing Library 9.1.0**.

### What the inactive build does

The Premium page displays **Prepared · Not Active**.

Premium feature tiles are intercepted by `MSAPremiumUI`; while Premium is disabled they cannot start a purchase or accidentally execute a paid-only action.

The entitlement engine always keeps Premium capabilities locked while `MSAPremiumConfig.active === false`, even if somebody restores or injects an old local entitlement cache.

Free capabilities remain available.

### Future activation sequence

Do not activate by changing only one JavaScript flag.

A production activation should be performed deliberately:

1. Create the Google Play subscription product `msa_one_premium` and its monthly/yearly base plans.
2. Deploy authenticated Premium backend endpoints.
3. Configure server-side Google Play Developer API credentials.
4. Configure `billing.verifyUrl`, `billing.entitlementUrl`, and the subscription-management URL.
5. Change the Premium config to active.
6. Generate Android with Capacitor.
7. Run `PREMIUM_ACTIVATE=1 node scripts/activate-premium-android.mjs`.
8. Build/test through a Google Play internal testing track.
9. Verify purchase, restore, cancellation, grace-period, on-hold, pending and expiry behavior before production release.

The activation script is not called by the normal Build 47 workflow.

The normal workflow also verifies that:
- `com.android.billingclient:billing` is absent from generated Android
- `PremiumBillingPlugin.java` is absent from generated Android

Therefore Build 47 contains the preparation code but does **not** include an active billing client in the APK.

## Prepared force-update / version policy

`www/version-policy.js` is also present but disabled.

It supports future policies such as:

- latest version available
- minimum supported version
- force update when an installed version is older than latest
- optional exact-version enforcement
- update message
- Play Store/update URL

Example remote policy:

```json
{
  "appId": "com.msa.one.displayfit37",
  "latestVersion": "47.0.0",
  "minSupportedVersion": "46.0.0",
  "forceUpdate": false,
  "requireExactVersion": false,
  "message": "A newer MSA One version is available.",
  "storeUrl": "https://play.google.com/store/apps/details?id=com.msa.one.displayfit37"
}
```

### Recommended enforcement rule

Use **minimum supported version** for mandatory updates instead of forcing every version mismatch.

For example:

- installed 47.0.0 / latest 47.1.0 / minimum 46.0.0 → allow app, show optional update
- installed 46.5.0 / minimum 47.0.0 → block and require update
- installed 46.5.0 / latest 47.0.0 / `forceUpdate:true` → block and require update

This lets you force a critical/security update without unnecessarily locking users out for every minor release.

The prepared policy defaults to **fail-open** on network/policy errors so a broken policy endpoint cannot brick the app. Change that only after the update service is production-tested.

## Server-side entitlement rule

The native app never grants Premium by itself.

Future flow:

Google Play purchase → purchase token → secure backend → Google Play Developer API verification → entitlement response → MSA One capability unlock.

Do not grant Premium when the Google purchase is still PENDING.

The backend helper maps ACTIVE and grace-period subscription states to Premium access, while on-hold/expired states do not receive Premium.

## App → Library Auto-Sync

The Built-in Library remains version-aware.

Build 47 adds two new prepared Library modules:

- **Premium System**
- **Version & Update Policy**

When Build 46 is upgraded to Build 47, Library auto-sync records those two modules as new while preserving:

- personal templates
- favorites
- recent-template history

The migration is covered by an executable Build 46→47 test.

The Library still does not download executable JavaScript itself. Executable capabilities arrive through a tested/signed application build; the Library indexes what is actually installed.

## Smooth Performance System

Build 45 performance improvements remain active:

- Auto / Smooth / Battery profiles
- frame-synced `requestAnimationFrame` motion
- visual-viewport responsive sizing
- row and column virtualization for large spreadsheets
- idle autosave
- chunked CSV/DOCX/XLSX/PPTX import
- shared in-memory project cache
- batched IndexedDB bootstrap
- Reading View with text/icon scaling

## Friendly Helper

Contextual help remains available across Home, Files, Create, Document, Spreadsheet, Presentation, PDF, Smart HTML, AI, Me, Library and Planner.

## Core Office capability

- DOCX import/export with supported formatting, tables and practical image round-trip
- multi-sheet XLSX import/export with formulas/shared strings
- PPTX import/export with slide text, layouts and practical image round-trip
- PDF text creation/export
- Smart HTML editing and sandbox preview
- CSV/TSV import and CSV export
- Files-level Open Office File
- IndexedDB mirroring and workspace backup/restore
- Calendar / Daily Planner
- built-in templates and Library auto-sync

## Quality checks

`npm test` covers:

- Build 47 package/manifest consistency
- Premium prepared-but-inactive behavior
- force-update version decisions while enforcement is disabled
- Google Play backend entitlement mapping
- Build 46→47 Library migration
- Performance/Reading contracts
- Office import/export round-trip
- large spreadsheet virtualization
- storage/backup
- Helper
- Planner
- Calendar

## Android build

GitHub Actions builds the Android debug APK with Capacitor.

1. Open **Actions → Build MSA One APK**.
2. Run the workflow manually or push a relevant source change to `main`.
3. Open the successful run.
4. Download **MSA-One-48-APK**.

The normal workflow keeps Premium inactive and sets Android `versionCode 48` / `versionName 48.0`.

## Development

- Node.js 22+
- Java 21
- Capacitor 7.4.3 pinned
- Google Play Billing preparation target: 9.1.0
- run `npm test` before building
