# Native office architecture research for msa_one

Status: research-only. No APK decompilation performed; WPS Office_9999.apk binary was not supplied. No runtime integration, dependency installation, billing change, or APK build is claimed.

## Verified existing repository interfaces
- `package.json`: Capacitor Android/core 7.4.3, Node >=22, npm test runs syntax checks and node tests.
- `native-prep/android/MSAPdfViewerActivity.java`: referenced by `tests/native-pdf-viewer.test.mjs`; existing Android PdfRenderer pathway, including pagination, zoom, lifecycle and rotation contracts.
- `native-prep/android/MSAFileBridgePlugin.java`: Capacitor plugin method `openPdfViewer` is asserted by tests.
- `www/native-file-bridge.js`: exports `MSANativeFiles.openPdfViewer`.
- `www/create-studio.js`: native viewer invoked through existing bridge.
- `scripts/apply-android-security.mjs`: copies native sources and registers non-exported PDF activity; disables cleartext and backups.
- `.github/workflows/build-apk.yml`: static checks for Android PDF integration.

## Architecture recommendation
Preserve the existing UI and bridge. Add document capabilities behind narrowly scoped interfaces:
1. `DocumentSource`: accept SAF content URIs, validate MIME and signatures, enforce file-size and decompression limits; never assume an absolute filesystem path.
2. `DocumentSession`: immutable document ID, read-only original, atomic versioned edits, cancellation and error state.
3. `DocumentRenderer`: continue native PdfRenderer for PDFs; assess LibreOfficeKit tiled rendering only in an isolated feasibility prototype, not as a drop-in binary.
4. `OfficeParser`: separate DOCX/XLSX/PPTX import/export from visual rendering; Apache POI is a candidate for structured extraction but not a full-fidelity page renderer.
5. `SearchIndex`: local SQLite FTS with page/sheet/slide anchors, provenance, resumable OCR and duplicate detection.
6. `DocumentUI`: reuse Create Studio and existing PDF viewer; add accessible progress, page navigation and cancellation without duplicate toolbars.

## External sources and license gates
- LibreOffice Android architecture: https://docs.libreoffice.org/android.html — LibreOfficeKit JNI, worker threading, tiled rendering and overlays. LibreOffice licensing: https://www.libreoffice.org/licenses/ (MPL 2.0 with third-party notices; inspect each included component).
- Apache POI: https://poi.apache.org/ and https://github.com/apache/poi — Apache 2.0, structured Office document API. POI 6.0.0 requires Java 17; validate Android desugaring and transitive dependencies before selection.
- Android platform PdfRenderer and Storage Access Framework: prefer platform APIs already in use, checking Android API level and security requirements.
- WPS APK: proprietary; no assumption that decompiled code, assets or native libraries are licensed for reuse.
- Other community repositories must be reviewed for provenance, license, activity and dependency risks before adoption.

## Verification and falsification gates
- No document content sent to a network without explicit opt-in.
- Reject malformed ZIP entries, path traversal, ZIP bombs, oversized pages and untrusted content URIs.
- Test SAF permission loss, process death, repeated imports, low memory, rotation, large files, corrupt PDFs and cancellation.
- Compare parsed text with rendered pages for DOCX/XLSX/PPTX; report fidelity limitations rather than claiming WPS equivalence.
- Run `npm test`, Android compilation, instrumentation smoke tests and inspect APK manifest/signing before claiming release readiness.
- Preserve main and production; keep all research changes isolated on this branch.

## Next implementation decision
First audit `www/office-engine.js`, `www/import-engine.js`, `www/storage-engine.js`, `www/native-file-bridge.js`, and native bridge code for actual functionality and limits. Then implement the smallest tested gap, beginning with robust offline import and anchored search, rather than adding heavyweight native rendering prematurely.
