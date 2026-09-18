# MSA One

MSA One is an all-in-one mobile office workspace for documents, spreadsheets, presentations, PDF, Smart HTML, planning, storage, reusable libraries and contextual help.

## Current build — MSA One 44

MSA One 44 keeps Android application ID `com.msa.one.displayfit37`, so it updates the existing installation instead of creating a separate app.

## Friendly Helper System

Build 44 adds a context-aware helper that stays with the user across the main MSA One workflows.

A small **?** button is always available. It opens a mobile bottom sheet on phones and a compact help panel on larger displays.

The helper automatically changes its content based on the current screen or editor.

Supported help contexts:

- Home
- Files
- Create
- Document
- Spreadsheet
- Presentation
- PDF
- Smart HTML
- AI workspace
- Me / workspace settings
- Built-in Library
- Planner

### Guide

Each context contains short task-based steps instead of a long manual.

For example, Spreadsheet guidance covers:

1. tap a cell,
2. type a value or formula,
3. use worksheet tabs,
4. preview a chart,
5. export XLSX.

Document guidance points to headings, tables, images and DOCX export.

Presentation guidance points to slide creation, layouts, images and PPTX export.

### Show Me

Every guide step can use **Show me**.

MSA One scrolls to the relevant control, highlights it and temporarily dims the rest of the screen. The highlight disappears automatically or when tapped.

### Examples

The helper contains practical examples for the active workspace, including spreadsheet formulas such as:

- `=C2*D2`
- `=SUM(E2:E20)`
- `=AVERAGE(C2:C12)`
- `=MIN(C2:C20)`
- `=MAX(C2:C20)`

Examples can be copied directly when clipboard access is available.

### Troubleshoot

Each main function has contextual recovery information.

Examples:

- DOCX layout looks different
- workbook formula errors
- unsupported PowerPoint animation
- large image/storage problems
- Office import failure
- backup/restore problems
- unavailable voice recognition
- difference between local routing and connected generative AI

### First-use behavior

The Helper does not run a long forced tutorial.

- A welcome hint is shown once.
- Each workspace can show one first-use nudge.
- Completed workspaces stop nudging.
- Manual help remains available through the **?** button.

Helper state is stored in `msaHelperV1`, mirrored to IndexedDB and included in workspace backup/restore.

## Friendly feedback and recovery

Build 44 also replaces several abrupt failure paths with clearer feedback.

- Office import errors can open **Troubleshoot**.
- Oversized drafts explain how to recover.
- Missing Office export services show a helper error instead of failing silently.
- Backup restore uses friendly success/error feedback.
- Project deletion includes the project name and offers **Undo** after deletion.
- Create Studio shows an additional helper status strip such as **Autosaved locally · Need help with Spreadsheet?**

The helper UI supports reduced-motion settings and responsive phone/desktop layouts.

## Built-in Function Library

The Built-in Library from Build 43 remains available and now includes **Friendly Helper** as another registered module.

The common API gateway can call helper functions as well:

- `MSALibrary.api('helper').open()`
- `MSALibrary.api('helper').troubleshoot()`
- `MSALibrary.api('helper').current()`

Existing module APIs remain available for Document, Spreadsheet, Presentation, PDF, Smart HTML, Files, Storage, Planner, Media, Voice and UI.

## Core functionality retained

- DOCX import/export with supported formatting, tables and practical image round-trip
- Multi-sheet XLSX import/export with formulas and shared strings
- PPTX import/export with slide text, layouts and practical image round-trip
- PDF text creation/export
- Smart HTML editor and sandbox preview
- CSV/TSV import and CSV export
- Files-level **Open Office File**
- IndexedDB mirroring and JSON workspace backup/restore
- Calendar / Daily Planner
- Built-in reusable templates
- Responsive mobile/desktop display fitting

## Quality checks

`npm test` now covers:

- Friendly Helper context registry and API
- first-use/helper persistence contracts
- Core/Media SDK
- Built-in Library and API gateway
- Create Studio friendly recovery paths
- Files Undo recovery
- storage of helper preferences
- spreadsheet formulas
- Office import/export round-trip
- Office media handling
- Calendar
- Build 44 consistency

## Current limitations

- Complex Word floating layouts, comments, tracked changes and advanced styles remain partial
- Excel macros, pivot tables, advanced formatting and native chart objects remain partial
- PowerPoint animations, SmartArt, audio/video and complex masters remain partial
- Very large media may be resized or skipped to protect local storage
- Some older WebViews without raw-deflate `DecompressionStream` support may not open normally compressed third-party Office files
- Real generative AI answers still require a connected AI backend
- Cloud synchronization is not connected
- Play Store release signing/AAB requires release credentials

## Android build

GitHub Actions builds the Android debug APK with Capacitor.

1. Open **Actions → Build MSA One APK**.
2. Run the workflow manually or push a relevant source change to `main`.
3. Open the successful run.
4. Download **MSA-One-44-APK**.

The workflow runs syntax checks and tests, verifies the helper/library assets, syncs the same `www` source into Capacitor, sets Android `versionCode 44` / `versionName 44.0`, builds the APK and uploads it.

## Development

- Node.js 22+
- Java 21
- Capacitor 7.4.3 pinned
- Run `npm test` before building
