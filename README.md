# MSA One

MSA One is an all-in-one mobile office workspace for documents, spreadsheets, presentations, PDF, Smart HTML, planning, storage, reusable libraries, contextual help and adaptive performance.

## Current build — MSA One 45

MSA One 45 keeps Android application ID `com.msa.one.displayfit37`, so it updates the existing installation instead of creating a separate app.

## Smooth Performance System

Build 45 adds a dedicated performance layer in `www/performance-engine.js` and `www/performance.css`.

### Adaptive performance modes

The app supports:

- **Auto** — chooses a practical profile from available CPU/memory hints
- **Smooth** — keeps richer effects and larger spreadsheet render windows
- **Battery** — reduces blur, shadows and render-window size

MSA One samples `requestAnimationFrame()` timing to estimate whether the current display is behaving closer to 60, 90 or 120 Hz. It does not force a refresh rate; animations stay synchronized to the refresh rate the WebView/browser actually provides.

### High-refresh-friendly motion

- draggable Lens updates are frame-synced with `requestAnimationFrame`
- no fixed `setInterval` animation loop is used
- CSS transitions remain refresh-rate independent
- lower-performance profiles reduce expensive blur/shadow work
- reduced-motion preferences remain supported

### Faster startup

- the previous fixed 1.6-second splash delay has been removed
- splash dismissal now happens immediately after the first rendered frames
- storage bootstrap batches IndexedDB reads/writes instead of repeatedly opening the database for each key
- superseded GitHub Actions APK builds are cancelled automatically

### Responsive display / resolution

The performance layer tracks `VisualViewport` where available and maintains:

- `--msa-vw`
- `--msa-vh`
- current viewport width/height
- portrait/landscape state
- device pixel ratio

Pages and Create Studio use the current visual viewport height, improving behavior around rotation and the mobile keyboard.

### Large spreadsheet performance

Large worksheets now use virtual row and column windows instead of creating every cell input at once.

Render-window size adapts to the performance profile.

The workbook data remains complete; only the currently visible row/column window is painted.

The spreadsheet includes row and column paging controls and still preserves formulas, sheets, XLSX export and CSV export.

### Idle autosave

Create Studio autosave is debounced and then scheduled during idle time when supported. Closing the editor still performs an immediate save.

A shared `MSAProjects` memory cache also avoids repeatedly parsing the full project array from localStorage during normal editing and Files rendering.

### Responsive import

Large import work is divided into smaller UI-friendly chunks:

- CSV parsing periodically yields to the browser
- OOXML ZIP reading yields between package entries
- DOCX parsing yields between document blocks
- XLSX parsing yields between worksheet row groups
- PPTX parsing yields between slide groups

Import status is shown through the performance busy indicator.

Office ZIP safety limits remain active for compressed size, expanded size, entry count and invalid ZIP bounds.

### Export feedback

Document, Spreadsheet, Presentation, PDF and Smart HTML export now use the common busy/status layer so the interface can render feedback before file generation starts.

## Reading View

Build 45 adds a dedicated **Reading View**.

Controls include:

- text size
- icon size
- reading line spacing
- distraction-free view
- one-tap exit

The reading toolbar uses clear `A−`, `A＋`, icon-size controls and a visible **Done** button.

Reading View makes supported editor fields read-only temporarily, hides unnecessary navigation/toolbars and restores the editing state when closed.

The Me page now contains **Smoothness & Reading** controls plus device/performance information.

## Built-in Library

The Built-in Function Library now also registers **Performance & Reading**.

Examples:

- `MSALibrary.api('performance').reading(true)`
- `MSALibrary.api('performance').mode('smooth')`
- `MSALibrary.api('performance').font(1.15)`
- `MSALibrary.api('performance').icons(1.1)`
- `MSALibrary.api('performance').device()`

Existing Library modules remain available for Core, Document, Spreadsheet, Presentation, PDF, Smart HTML, Files, Storage, Planner, Media, Voice, UI and Friendly Helper.

## Friendly Helper retained

Build 44 contextual help remains available across:

- Home
- Files
- Create
- Document
- Spreadsheet
- Presentation
- PDF
- Smart HTML
- AI workspace
- Me
- Built-in Library
- Planner

The Helper no longer uses a global subtree MutationObserver. Navigation and editor events refresh it explicitly, reducing unnecessary DOM observation work.

## Core functionality retained

- DOCX import/export with supported formatting, tables and practical image round-trip
- multi-sheet XLSX import/export with formulas/shared strings
- PPTX import/export with slide text, layouts and practical image round-trip
- PDF text creation/export
- Smart HTML editing and sandbox preview
- CSV/TSV import and CSV export
- Files-level **Open Office File**
- IndexedDB mirroring and JSON workspace backup/restore
- Calendar / Daily Planner
- built-in reusable templates
- responsive mobile/desktop display fitting
- Friendly Helper + Show Me + troubleshooting

## Quality checks

`npm test` now covers:

- Build 45 package/version consistency
- performance engine APIs
- Reading View CSS/contracts
- frame-synced and idle-scheduling primitives
- virtual spreadsheet rows/columns
- chunked CSV and Office import
- shared project cache
- batched storage bootstrap
- Core/Media SDK
- Built-in Library + Performance API
- Friendly Helper
- Files/Planner recovery
- spreadsheet formulas
- Office import/export round-trip
- Office media handling
- Calendar

## Current limitations

- Web apps cannot force the Android display to 90/120 Hz; actual refresh rate is controlled by the device/WebView. MSA One is designed to avoid artificially capping animation and to follow `requestAnimationFrame`.
- very large Office exports are still generated on the main JavaScript thread; progress appears before generation, but truly huge exports may still produce a short pause
- project persistence still keeps a localStorage-compatible project representation, so very large media-heavy projects can hit browser/WebView storage limits
- complex Word floating layouts/comments/tracked changes remain partial
- Excel macros, pivot tables, advanced styles and native chart objects remain partial
- PowerPoint animation, SmartArt, audio/video and complex masters remain partial
- real generative AI responses still require a connected AI backend
- cloud synchronization is not connected
- Play Store release signing/AAB requires release credentials

## Android build

GitHub Actions builds the Android debug APK with Capacitor.

1. Open **Actions → Build MSA One APK**.
2. Run the workflow manually or push a relevant source change to `main`.
3. Open the successful run.
4. Download **MSA-One-45-APK**.

The workflow runs syntax/tests, verifies performance/helper/library assets, syncs the same `www` source into Capacitor, sets Android `versionCode 45` / `versionName 45.0`, builds the APK and uploads it.

## Development

- Node.js 22+
- Java 21
- Capacitor 7.4.3 pinned
- run `npm test` before building
