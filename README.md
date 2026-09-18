# MSA One

MSA One is an all-in-one mobile office workspace for local documents, spreadsheets, presentations, PDF text documents, Smart HTML, planning data and workspace backups.

## Current build — MSA One 42

MSA One 42 keeps the Android application ID `com.msa.one.displayfit37` so it can update the existing MSA One installation instead of appearing as a separate app.

### Working offline/on-device

- Responsive Home, Files, Create, AI, Calendar and Me pages
- Android display auto-fit and portrait/landscape guards
- Document editor with headings, bold, italic, underline, lists, tables and image insertion
- Document images are resized locally before storage to reduce project size
- DOCX export now packages supported document images into `word/media`, creates document relationships and writes DrawingML image elements
- DOCX import restores practical embedded images, so supported images can survive DOCX → MSA One → DOCX
- Spreadsheet formulas, formula preview, chart preview and multi-sheet editing
- Multi-sheet XLSX import/export with shared strings, formulas and worksheet names
- Presentation editor with embedded image support and PPTX image import/export
- PDF text workspace and PDF export
- Smart HTML editor with sandbox preview and HTML export
- IndexedDB mirror plus JSON workspace backup/restore
- Calendar / Daily Planner
- Button Studio customization

### Files workspace

The Files page now includes **Open Office File**. A DOCX, XLSX or PPTX can be selected directly from Files without first choosing a Create workspace.

MSA One detects the Office type, imports it with the OOXML engine, saves it as a local editable project and opens the correct editor automatically.

### Office round-trip architecture

- `www/office-engine.js` creates DOCX, XLSX, PPTX and PDF files
- `www/import-engine.js` reads DOCX, XLSX and PPTX OOXML ZIP packages
- `www/formula-engine.js` evaluates the supported local spreadsheet formulas
- `www/storage-engine.js` mirrors important app data to IndexedDB

DOCX media round-trip currently targets PNG/JPEG images. Imported Office images are size-limited for safer WebView storage.

### Quality checks

`npm test` performs JavaScript syntax checks before running the contract/unit tests. CI also verifies:

- Office importer packaging
- multi-sheet XLSX round-trip
- formula preservation
- DOCX image relationship/media code
- Files-level Office opener
- Build 42 Android package/version consistency

### Current limitations

- Complex Word floating layouts, comments, tracked changes and advanced styles are only partially represented
- DOCX image layout is simplified to inline images during MSA One export
- Excel macros, pivot tables, advanced formatting and native embedded chart objects are not fully supported
- PowerPoint animations, audio/video, SmartArt and complex masters are not fully supported
- Very large imported media may be skipped or resized to protect local storage
- Some older WebViews without raw-deflate `DecompressionStream` support may not open normally compressed third-party Office files
- Real generative AI responses still require an AI backend
- Cloud synchronization and production presenter services are not connected
- Play Store signed release/AAB signing still requires release credentials

Local drafts are mirrored between localStorage and IndexedDB and can be exported from **Me → Backup Workspace**. Clearing app storage or uninstalling can still remove unsynchronized local data, so backups remain important.

## Android build

GitHub Actions builds the Android debug APK with Capacitor.

1. Open **Actions → Build MSA One APK**.
2. Run the workflow manually or push a relevant source change to `main`.
3. Open the successful run.
4. Download **MSA-One-42-APK**.

The workflow runs syntax checks and tests, verifies Calendar plus storage/Office/import/formula/media features, syncs the same `www` source into Capacitor, sets Android `versionCode 42` / `versionName 42.0`, builds the APK and uploads it as an artifact.

## Development

- Node.js 22 or newer
- Java 21 for Android builds
- Capacitor 7.4.3 pinned at the top level
- Run `npm test` before building
