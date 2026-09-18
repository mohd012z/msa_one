# MSA One

MSA One is an all-in-one mobile office workspace for local documents, spreadsheets, presentations, PDF text documents, Smart HTML, planning data and workspace backups.

## Current build — MSA One 40

MSA One 40 keeps the Android application ID `com.msa.one.displayfit37` so it can update the existing MSA One installation instead of appearing as a separate app.

### Working offline/on-device

- Responsive Home, Files, Create, AI, Calendar and Me pages
- Android display auto-fit and portrait/landscape guards
- Document editor with headings, bold, italic, underline, lists and simple tables
- DOCX export that preserves those supported rich document structures
- Spreadsheet grid with formulas, formula result preview and quick bar-chart preview
- Local formula support for arithmetic cell references plus `SUM`, `AVERAGE`, `MIN` and `MAX`
- XLSX export with real formula cells and forced Excel recalculation
- CSV export
- Presentation editor with multiple slides, image attachment/resizing and three layouts
- PPTX export with embedded JPEG/PNG media
- PDF text editor with PDF export
- Smart HTML editor with sandbox preview and HTML export
- Offline import:
  - CSV / TSV → Spreadsheet
  - TXT / HTML → Document
  - HTML / TXT → Smart HTML
  - TXT → PDF workspace
  - Image / MSA presentation JSON → Presentation
- Local draft search, open, rename, duplicate and delete
- Calendar / Daily Planner with Daily Program, Plan, Diary and Note entries
- IndexedDB mirror for important local data
- JSON workspace backup and restore for drafts, planner and settings
- Button Studio appearance settings
- File/image picker and supported-device voice input shortcuts
- Offline task routing from the AI workspace into the appropriate local workspace

The Office exporters are implemented locally in `www/office-engine.js`, and spreadsheet calculations use `www/formula-engine.js`. These do not require a CDN or network connection.

### Quality checks

`npm test` now performs JavaScript syntax checks for the browser runtime files before executing the Node contract/unit tests. The formula engine has executable calculation tests, not only string-presence checks.

### Still requires external/production services

- Real generative AI model responses
- High-fidelity import/conversion of arbitrary DOCX/XLSX/PPTX files
- Full Excel compatibility such as every formula function, pivot tables and native embedded chart objects
- Advanced Word page layout, comments and tracked changes
- Advanced PowerPoint themes, animations, video/audio and master editing
- Cloud synchronization and multi-device storage
- Production speech/presenter services
- Signed Play Store / release AAB pipeline

Local drafts are mirrored between localStorage and IndexedDB, and can also be exported from **Me → Backup Workspace**. Clearing app storage or uninstalling can still remove unsynchronized local data, so backups remain important.

## Android build

GitHub Actions builds the Android debug APK with Capacitor.

1. Open **Actions → Build MSA One APK**.
2. Run the workflow manually or push a relevant source change to `main`.
3. Open the successful run.
4. Download **MSA-One-40-APK**.

The workflow runs source syntax checks and all tests, verifies Calendar plus the storage/Office/formula engines, syncs the same `www` source into Capacitor, sets Android `versionCode 40` / `versionName 40.0`, builds the APK and uploads it as an artifact.

## Development

- Node.js 22 or newer
- Java 21 for Android builds
- Capacitor 7.4.3 pinned at the top level
- Run `npm test` before building
