# TechTrace V40.5.2 methods integrated into MSA One

Source reviewed: `TechTrace_Android_V40_5_2_Header_SystemBar_Fix_Source.zip`

## Imported methods

### 1. Android system-bar inset handling
TechTrace's `WindowInsets` strategy was adapted into the generated Capacitor `MainActivity`.

MSA One now:
- keeps WebView content below the status bar / display cutout
- keeps content above the navigation bar
- reapplies insets after system changes
- retains all existing WebView security settings

### 2. Storage Access Framework folder picker
TechTrace's `ACTION_OPEN_DOCUMENT_TREE` approach was ported into `MSAFileBridgePlugin`.

MSA One now:
- lets the user choose a folder using Android's system picker
- stores persistable URI permission
- recursively scans supported files using `DocumentsContract`
- exposes a Re-scan action without requiring the folder to be selected again
- caps discovery at 1000 supported files
- limits an import batch to 50 projects

### 3. Persistable single-file picker
A safer Capacitor version of TechTrace's native file selection was added.

MSA One can persist read permission for selected Android documents, which is especially useful for PDFs that must reopen after app restart.

### 4. Native Downloads save
TechTrace's MediaStore export method was adapted for MSA One.

Office/PDF exports now prefer:
`Downloads/MSA One/<filename>`

The browser download path remains as a fallback.

### 5. Safe filename normalization
TechTrace's filename-cleaning approach was retained for native exports.

### 6. State-preserving native source references
Imported native PDFs are stored as a persisted URI reference rather than a temporary `blob:` URL.
The PDF bytes are loaded only when the document is opened.

## MSA One improvements beyond the TechTrace source

- Capacitor plugin boundary instead of raw `addJavascriptInterface`
- background folder scanning / file reads
- 32 MB single-file bridge limit
- 1000-file folder discovery cap
- descriptor-based import so PDFs do not have to be copied into JS memory
- native file picker + persisted URI for restart-safe PDFs
- browser fallback for non-Android use
- CI checks for native plugin registration and Android packaging
- automatic cleanup of failed MediaStore writes

## TechTrace settings intentionally NOT copied

The following source settings would weaken MSA One and were rejected:

- `setAllowFileAccess(true)`
- `MIXED_CONTENT_ALWAYS_ALLOW`
- `android:usesCleartextTraffic="true"`
- raw `addJavascriptInterface(...)`
- unrestricted WebView file access
- legacy public-storage write behavior

MSA One keeps:

- cleartext disabled
- mixed content blocked
- WebView file access disabled
- WebView universal file-URL access disabled
- Safe Browsing enabled
- Android automatic app backup disabled
- CSP and content sanitization

## Main files

- `native-prep/android/MSAFileBridgePlugin.java`
- `www/native-file-bridge.js`
- `scripts/apply-android-security.mjs`
- `www/files-workspace.js`
- `www/create-studio.js`
- `www/office-engine.js`
- `tests/native-file-bridge.test.mjs`

## Android behavior notes

Android's Storage Access Framework grants access only to folders/files selected by the user. On Android 11+, system restrictions still prevent apps from selecting protected locations such as `Android/data`, `Android/obb`, storage roots and some Download-root cases.

Build 51 keeps the remote update policy optional while this native bridge is validated on real devices.
