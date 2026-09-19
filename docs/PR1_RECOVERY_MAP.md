# PR #1 Recovery Map — MSA One Build 54

This review compares `feature/create-studio-plan-complete` with the current Build 54 `main` branch.

## Salvaged into Build 54

### Mobile/accessibility diagnostics
PR #1 contained `mobile-accessibility-security.js`. Its useful ideas were retained, but the implementation was rewritten for the current Build 54 namespaces and behavior.

Build 54 module: `www/mobile-quality.js`

Retained ideas:
- 44 px touch-target audit
- icon-button accessibility check
- viewport contract check
- storage/recovery health check
- CSP/security presence check
- safe import size/type preflight

The new module uses current Build 54 services: `MSAFiles`, `MSAStudio`, `MSAStorage`, `MSASecurity`, `MSAProjects`, and `MSANativeFiles`.

### PDF readiness tracking
PR #1 contained `pdf-intelligence-workspace-v2.js`. The old module depended on stale agent/runtime names and implied future OCR routing.

Build 54 module: `www/pdf-readiness.js`

Retained ideas:
- per-page readiness state
- TEXT_READY / SCANNED / PARTIAL / UNKNOWN states
- page-count tracking
- document-level readiness summary
- explicit `needsOCR` signal
- local persistence

Build 54 deliberately reports:
- built-in OCR: false
- searchable text extraction: false

This avoids claiming OCR capability that is not implemented inside MSA One.

## Superseded — do not merge

### `www/project-store.js`
Do not merge. Build 54 now has validated project recovery, previous-valid backup, last-known-good snapshot, lifecycle flush, and IndexedDB bootstrap protection in `core-library.js` + `storage-engine.js`.

### `www/smart-html-v2.js`
Do not merge. Current Create Studio already provides Smart HTML editing, sandbox preview and central `MSASecurity` sanitization. The old module used a separate sanitizer and stale `MSAProjectStore` integration.

### `www/file-import-center-v2.js`
Do not merge. It marks DOCX/XLSX/PPTX as LATER even though Build 54 has real local import paths through `MSAImport` and native file integration.

### `www/raga-conversion-matrix-v2.js`
Do not merge. Its capability matrix is stale and would downgrade current Office support or present misleading PREVIEW/LATER labels.

### `www/runtime-integration-v2.js`
Do not merge. It targets old namespaces such as `MSAFilesWorkspace`, `MSAProjectStore`, `MSARagaConverter`, `MSAAnwarLens`, and `MSAAgentRouter`. Current Build 54 routing is handled by `MSAAppShell`, `MSAFiles`, `MSAStudio`, `MSAAIWorkspace`, and `MSAActions`.

### production-engine-v2 modules
Do not merge wholesale:
- `document-production-engine-v2.js`
- `spreadsheet-production-engine-v2.js`
- `presentation-production-engine-v2.js`

They introduce parallel document/workbook/deck models that would compete with the current Create Studio state and Office import/export engines.

Useful ideas to migrate separately later:
- explicit undo/redo history
- editor adapter around deprecated `document.execCommand`
- structured operation history
- speaker notes / richer slide element editing

### `www/ui-action-controller-v2.js`
Do not merge. It depends on the stale v2 production engines and several PREVIEW paths. Current action routing is already implemented through `app-actions.js`, `app-shell.js`, Tools Center, Files and Create Studio.

### `www/kaga-template-library-v2.js`
Do not merge. Current Build 54 already has `template-catalog.js`, `template-center.js`, built-in Library templates and user-template persistence.

## Keep PR #1 as an archive/recovery branch

PR #1 should remain unmerged. It is useful as a historical source for individual ideas, but merging it wholesale would overwrite newer Build 54 behavior and reintroduce stale capability assumptions.

## Additional salvage completed

### Editor adapter + undo/redo
The useful history ideas from the old production-engine modules were migrated without importing their parallel document models.

Build 54 now uses:
- `www/editor-history.js` for bounded, coalesced, session undo/redo
- `www/editor-adapter.js` to isolate legacy `execCommand` formatting behind one replaceable adapter
- Create Studio Undo/Redo controls inside the existing horizontally scrollable editor toolbar
- Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z and Ctrl/Cmd+Y shortcuts

The current Document, Spreadsheet, Presentation, PDF and Smart HTML project formats remain unchanged.

## Next salvage candidates

1. Expand PDF readiness into real local PDF text detection only after a working engine exists.
2. Add runtime accessibility regression tests at narrow Android viewports.
3. Add a dedicated Diagnostics page/card using `MSAMobileQuality`.
4. Add schema-versioned project migrations once the data model changes.
