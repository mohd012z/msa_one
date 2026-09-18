# MSA One

MSA One is an all-in-one mobile office workspace that can create and manage local documents, spreadsheets, presentations, PDF text documents, Smart HTML, planning data and workspace backups.

## Current build — MSA One 39

MSA One 39 keeps the Android application ID `com.msa.one.displayfit37` so it can update the existing MSA One installation instead of appearing as a separate app.

### Working offline/on-device

- Responsive Home, Files, Create, AI, Calendar and Me pages
- Android display auto-fit and portrait/landscape guards
- Document editor with autosave and **DOCX export**
- Spreadsheet grid editor with row/column controls and **XLSX + CSV export**
- Multi-slide presentation editor with **PPTX export**
- PDF text editor with **PDF export**
- Smart HTML editor with sandbox preview and HTML export
- Local draft search, open, rename, duplicate and delete
- Calendar / Daily Planner with Daily Program, Plan, Diary and Note entries
- IndexedDB mirror for important local data
- JSON workspace backup and restore for drafts, planner and settings
- Button Studio appearance settings
- File/image picker and supported-device voice input shortcuts
- Offline task routing from the AI workspace into the appropriate local workspace

The DOCX/XLSX/PPTX/PDF exporters are implemented locally in `www/office-engine.js`. They do not require a CDN or network connection.

### Still requires external/production services

- Real generative AI model responses
- High-fidelity Office import/conversion of arbitrary third-party files
- Advanced formulas/charts and full Excel compatibility features
- Rich PowerPoint themes, media and animations
- Cloud synchronization and multi-device storage
- Production speech/presenter services
- Signed Play Store / release AAB pipeline

Local drafts are mirrored between localStorage and IndexedDB, and can also be exported from **Me → Backup Workspace**. Clearing app storage or uninstalling can still remove unsynchronized local data, so backups remain important.

## Android build

GitHub Actions builds the Android debug APK with Capacitor.

1. Open **Actions → Build MSA One APK**.
2. Run the workflow manually or push a relevant source change to `main`.
3. Open the successful run.
4. Download **MSA-One-39-APK**.

The workflow runs all source contracts, verifies the permanent Calendar, Office engine and storage engine, syncs the same `www` source into Capacitor, sets Android `versionCode 39` / `versionName 39.0`, builds the APK and uploads it as an artifact.

## Development

- Node.js 22 or newer
- Java 21 for Android builds
- Capacitor 7.4.3 pinned at the top level
- Run `npm test` before building
