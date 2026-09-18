# MSA One

MSA One is an all-in-one mobile office workspace for local documents, spreadsheets, presentations, PDF text documents, Smart HTML, planning data and workspace backups.

## Current build — MSA One 41

MSA One 41 keeps the Android application ID `com.msa.one.displayfit37` so it can update the existing MSA One installation instead of appearing as a separate app.

### Working offline/on-device

- Responsive Home, Files, Create, AI, Calendar and Me pages
- Android display auto-fit and portrait/landscape guards
- Document editor with headings, bold, italic, underline, lists and simple tables
- DOCX export preserving the supported rich document structures
- DOCX import for paragraphs, headings, basic run formatting, tables and practical embedded images
- Spreadsheet grid with formulas, formula result preview and quick bar-chart preview
- Local formula support for arithmetic cell references plus `SUM`, `AVERAGE`, `MIN` and `MAX`
- Multi-sheet spreadsheets with add, switch, rename and delete sheet controls
- XLSX export with multiple worksheets, formula cells and Excel recalculation
- XLSX import with worksheet names, multiple sheets, shared strings, values and formulas
- CSV / TSV import and CSV export
- Presentation editor with multiple slides, image attachment/resizing and three layouts
- PPTX export with embedded JPEG/PNG media
- PPTX import for slide order, slide text and a practical first embedded image per slide
- PDF text editor with PDF export
- Smart HTML editor with sandbox preview and HTML export
- IndexedDB mirror for important local data
- JSON workspace backup and restore for drafts, planner and settings
- Calendar / Daily Planner with Daily Program, Plan, Diary and Note entries
- Button Studio appearance settings
- File/image picker and supported-device voice input shortcuts
- Offline task routing from the AI workspace

### Office import architecture

`www/import-engine.js` reads OOXML ZIP packages directly in the WebView. It supports stored ZIP entries and standard deflated ZIP entries through `DecompressionStream`, follows Office relationship files and extracts the parts MSA One can edit.

The supported native Office import formats are:

- `.docx` → Document
- `.xlsx` → Spreadsheet
- `.pptx` → Presentation

Simpler local imports remain available for TXT, HTML, CSV, TSV, images and presentation JSON.

### Quality checks

`npm test` performs JavaScript syntax checks before running Node tests. Build 41 includes an executable round-trip test that:

1. creates a two-sheet XLSX with MSA One,
2. opens the generated OOXML ZIP with the import engine,
3. verifies both worksheet files and names,
4. verifies that a formula cell remains present.

### Current limitations

- Complex Word layouts, floating objects, comments, tracked changes and advanced styles are only partially represented
- Excel styles, macros, pivot tables, conditional formatting and native chart objects are not fully imported
- PowerPoint animations, audio/video, SmartArt and complex masters are not fully imported
- Imported Office images are intentionally limited in size for safer on-device storage
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
4. Download **MSA-One-41-APK**.

The workflow runs syntax checks and tests, verifies the Calendar plus storage/Office/import/formula engines, syncs the same `www` source into Capacitor, sets Android `versionCode 41` / `versionName 41.0`, builds the APK and uploads it as an artifact.

## Development

- Node.js 22 or newer
- Java 21 for Android builds
- Capacitor 7.4.3 pinned at the top level
- Run `npm test` before building
