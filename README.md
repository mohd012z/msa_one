# MSA One

MSA One is an all-in-one mobile office workspace for local documents, spreadsheets, presentations, PDF text documents, Smart HTML, planning, storage and reusable built-in libraries.

## Current build — MSA One 43

MSA One 43 keeps the Android application ID `com.msa.one.displayfit37` so it updates the existing MSA One installation instead of appearing as a separate app.

## Built-in Function Library

Build 43 adds a permanent offline Library packaged inside the APK. It is not a web/CDN catalog: the modules, helpers, templates and capability checks are stored with the application.

The Library currently registers these main-function modules:

- **Core SDK** — escaping, safe names, IDs, JSON parsing, clamp/debounce, downloads, file picker and event helpers
- **Document** — rich editor, tables, images, DOCX/PDF workflows
- **Spreadsheet** — multi-sheet grid, formulas, chart preview, XLSX/CSV workflows
- **Presentation** — slides, layouts, images and PPTX workflows
- **PDF** — local PDF text workspace and export
- **Smart HTML** — HTML source, sandbox preview and export
- **Files** — local draft management and direct Office-file opening
- **Storage & Backup** — localStorage, IndexedDB mirror, JSON backup and restore
- **Planner** — Daily Program, Plan, Diary and Note calendar workflows
- **Media** — image reading, resizing/compression and Office media conversion
- **Voice & AI Routing** — device speech input and local task routing
- **UI & Display** — display fit, orientation handling and Button Studio

The Library appears from Home and Me and reports which packaged modules are ready on the current device.

### Unified Library API

Build 43 adds a common API gateway:

`MSALibrary.call(module, action, ...args)`

Examples of registered groups include:

- `MSALibrary.api('document')`
- `MSALibrary.api('spreadsheet')`
- `MSALibrary.api('presentation')`
- `MSALibrary.api('pdf')`
- `MSALibrary.api('html')`
- `MSALibrary.api('files')`
- `MSALibrary.api('storage')`
- `MSALibrary.api('planner')`
- `MSALibrary.api('media')`
- `MSALibrary.api('voice')`
- `MSALibrary.api('ui')`

This gives future MSA One code one stable entry point instead of directly coupling every screen to many global objects.

## Built-in Template Library

Build 43 includes reusable offline starter templates for the major creation functions.

### Document templates
- Professional Report
- Formal Letter
- Meeting Minutes
- Procedure / SOP

### Spreadsheet templates
- Budget Tracker
- Inventory Register
- KPI Dashboard Data
- Task Tracker

Spreadsheet templates can include multiple sheets and formulas.

### Presentation templates
- Project Update
- Training Deck
- Proposal Deck

### PDF templates
- PDF Notes
- PDF Checklist

### Smart HTML templates
- Knowledge Guide
- Mini Dashboard
- Offline Form

Selecting **Use** creates a real editable project through the new `MSAStudio.createProject()` library API.

The existing Dashboard button is also connected to the built-in Mini Dashboard template instead of remaining a non-functional tile.

## Shared Core and Media SDK

`www/core-library.js` provides two reusable built-in objects:

- `MSACore`
- `MSAMedia`

Create Studio, Office export and Files now use these shared helpers with local fallbacks. This reduces duplicate implementations for escaping, project naming, JSON handling and image resizing.

## Existing Office capabilities

- DOCX import/export with supported rich text, tables and practical image round-trip
- Multi-sheet XLSX import/export with formulas and shared strings
- PPTX import/export with slide text, layouts and practical image round-trip
- PDF text creation/export
- Smart HTML editing and export
- CSV/TSV import and CSV export
- Files-level **Open Office File**
- IndexedDB mirroring plus JSON workspace backup/restore
- Calendar / Daily Planner
- Responsive mobile/desktop display fitting

## Quality checks

`npm test` now checks browser JavaScript syntax and runs executable/contract tests for:

- Core SDK
- Media SDK
- Built-in Library registry
- Library API gateway
- built-in templates
- spreadsheet formulas
- Office ZIP/XLSX round-trip
- Office media handling
- Create Studio
- Files workspace
- storage/backup
- Calendar
- Build 43 package consistency

## Current limitations

- Complex Word floating layouts, comments, tracked changes and advanced styles remain partial
- Excel macros, pivot tables, advanced formatting and native embedded chart objects remain partial
- PowerPoint animation, SmartArt, audio/video and complex masters remain partial
- Very large imported media may be resized or skipped to protect local storage
- Some older WebViews without raw-deflate `DecompressionStream` support may not open normally compressed third-party Office files
- Real generative AI responses still require a backend/model connection
- Cloud synchronization is not yet connected
- Play Store release signing/AAB still requires release credentials

## Android build

GitHub Actions builds the Android debug APK with Capacitor.

1. Open **Actions → Build MSA One APK**.
2. Run the workflow manually or push a relevant source change to `main`.
3. Open the successful run.
4. Download **MSA-One-43-APK**.

The workflow runs syntax/tests, verifies the built-in libraries and Office engines, syncs the same `www` source into Capacitor, sets Android `versionCode 43` / `versionName 43.0`, builds the APK and uploads it.

## Development

- Node.js 22+
- Java 21 for Android builds
- Capacitor 7.4.3 pinned
- Run `npm test` before building
