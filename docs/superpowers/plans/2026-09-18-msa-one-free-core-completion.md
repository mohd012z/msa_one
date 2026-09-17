# MSA One Free Core Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the useful free/offline MSA One core across local storage, Files, Document, Smart HTML, Spreadsheet, Presentation, PDF workspace, Calendar, mobile usability, security and APK delivery.

**Architecture:** Keep one local-first project graph through `MSAProjectStore`, one Files workspace, and one Create Studio shell. Each feature batch is implemented with TDD and must pass the permanent Agent Sahab source/Android/APK gate before the next major batch is accepted.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, IndexedDB + localStorage recovery mirror, Capacitor Android, Node contract/behavior tests, Gradle lint/build, GitHub Actions.

**Spec:** Approved Create Studio design and `docs/superpowers/plans/2026-09-18-create-studio.md`; Agent Sahab policy in Issue #2 and `docs/superpowers/plans/2026-09-18-agent-sahab-bot.md`.

## Global Constraints

- Free-first core: no paid API, SDK, cloud service, subscription or premium infrastructure required.
- Preserve Build 37 adaptive display behavior and narrow Android portrait fit.
- Preserve current `com.msa.one.displayfit37` application ID until a separate migration is approved.
- Autosave and recovery must survive Android lifecycle exits as far as browser/OS storage permits.
- User content remains local by default; imports/exports are explicit user actions.
- Do not claim native Office/PDF conversion unless a real free implementation exists and passes tests.
- Every major batch uses RED → GREEN → Agent Sahab → Android lint/build/APK inspection.
- Agent Sahab recommendations are separated from blocking failures; only blocking failures prevent APK publication.

---

### Task 1: Storage & Recovery Hardening

**Files:** Modify `www/project-store.js`; tests `tests/project-store.test.mjs` plus focused behavior tests.

- [ ] Add RED tests for primary-store corruption, backup recovery, restore validation, duplicate IDs and lifecycle flush.
- [ ] Add backup-key recovery and deterministic IndexedDB/localStorage reconciliation.
- [ ] Validate restored project schema/type/id and bound unsafe/oversized fields.
- [ ] Preserve last-known-good backup before destructive restore/migration.
- [ ] GREEN all storage tests.
- [ ] Run Agent Sahab gate; fix blockers before Task 2.

### Task 2: Files Workspace Complete Flow

**Files:** Modify `www/files-workspace.js`, `www/files-workspace.css`; tests `tests/files-workspace.test.mjs`.

- [ ] Add RED tests for safe project IDs/titles and import/export controls.
- [ ] Harden DOM rendering against restored-data attribute injection.
- [ ] Add local MSA backup export/import using `MSAProjectStore.backup/restore`.
- [ ] Improve search, empty state, rename, duplicate and delete recovery UX.
- [ ] Add explicit file type/update metadata without breaking narrow portrait layout.
- [ ] GREEN tests and Agent Sahab gate.

### Task 3: Document Editor Free Core

**Files:** Modify `www/create-studio.js`, `www/create-studio.css`; extend Create Studio tests.

- [ ] Add RED tests for document autosave, title/content restore, undo-safe editing and export.
- [ ] Isolate deprecated `document.execCommand` behind a compatibility adapter.
- [ ] Add dependable plain HTML/text export and local share/download path supported by the browser/Capacitor environment.
- [ ] Improve mobile toolbar focus, selection and keyboard behavior.
- [ ] GREEN tests and Agent Sahab gate.

### Task 4: Smart HTML Workspace

**Files:** Modify `www/create-studio.js`; tests `tests/create-formats.test.mjs`.

- [ ] Add RED tests for sandbox policy, source persistence, preview refresh and import/export.
- [ ] Keep preview iframe sandboxed without unsafe same-origin privilege combination.
- [ ] Add HTML import, editable source, refresh/reset preview and `.html` export.
- [ ] Preserve source exactly; never execute imported HTML in the parent app context.
- [ ] GREEN tests and Agent Sahab gate.

### Task 5: Spreadsheet Practical Editor

**Files:** Prefer focused `www/studio-spreadsheet.js` if existing Create Studio file becomes unwieldy; otherwise modify `www/create-studio.js`; CSS/tests accordingly.

- [ ] Add RED tests for row/column editing, persistence, CSV import/export and mobile containment.
- [ ] Implement editable grid with add/delete rows/columns and safe cell text.
- [ ] Add CSV import/export without claiming `.xlsx` support.
- [ ] Add simple deterministic formulas only if they can be implemented safely offline; otherwise label as Later.
- [ ] GREEN tests and Agent Sahab gate.

### Task 6: Presentation Practical Editor

**Files:** Prefer focused `www/studio-presentation.js` if needed; CSS/tests accordingly.

- [ ] Add RED tests for slide add/delete/reorder, persistence and presentation preview.
- [ ] Implement title/body slide editing and reorder controls.
- [ ] Add local JSON/HTML presentation export where truthful and reliable.
- [ ] Keep PowerPoint `.pptx` generation marked Later unless a tested free engine is added deliberately.
- [ ] GREEN tests and Agent Sahab gate.

### Task 7: PDF Workspace Free Scope

**Files:** Modify/create focused PDF workspace module and tests.

- [ ] Add RED tests defining supported PDF workspace behavior.
- [ ] Support project notes/metadata and safe PDF-related workspace state that is genuinely implemented offline.
- [ ] Do not claim PDF→Word, Office→PDF or native PDF authoring without a tested engine.
- [ ] Provide clear `Prepared / Available / Later` capability labels.
- [ ] GREEN tests and Agent Sahab gate.

### Task 8: Calendar & Planner Completion

**Files:** Modify `tests/calendar-visibility.test.mjs`, `www/planner.js`, `www/planner.css` only where test exposes a real defect; workflow.

- [ ] Repair the stale Calendar visibility contract against current planner behavior.
- [ ] Remove the workflow skip for `calendar-visibility.test.mjs`.
- [ ] Verify every `tests/*.test.mjs` runs.
- [ ] Check planner persistence, reopen behavior and narrow-screen containment.
- [ ] GREEN tests and Agent Sahab gate.

### Task 9: Accessibility, Security & Mobile Hardening

**Files:** Create/extend audit tests; modify affected modules only for demonstrated findings.

- [ ] Test accessible names, keyboard/focus behavior, touch targets and responsive containment.
- [ ] Audit HTML injection surfaces and imported project validation.
- [ ] Audit iframe sandbox, external navigation and file import handling.
- [ ] Verify lifecycle flush and no data reset on refresh/reopen.
- [ ] Keep recommendations vs blockers explicit.
- [ ] GREEN tests and Agent Sahab gate.

### Task 10: Agent Sahab Full-App Completion Audit

**Files:** `scripts/agent-sahab-source-audit.mjs`, `scripts/agent-sahab-audit.sh`, `scripts/agent-sahab-verdict.mjs`, workflow and Issue #2 audit record.

- [ ] Inventory all shipped `www/*.js`, required CSS, tests and packaged Android assets.
- [ ] Run all Node tests with no skip.
- [ ] Run Agent Sahab source audit.
- [ ] Run Gradle `lintDebug`.
- [ ] Build debug APK.
- [ ] Inspect APK ZIP, manifest, dex, packaged web assets, package/version and SHA-256.
- [ ] Require final `APPROVED` verdict before artifact publication.
- [ ] Upload Agent Sahab source report, APK report, lint evidence and verdict.
- [ ] Publish audited APK only after all blocking checks pass.
- [ ] Record final evidence in Issue #2 and verify PR status before integration.

## Agent Sahab Responsibilities for Every Batch

Agent Sahab is the technical gate, not a fictional human reviewer. For each batch it must check the regression contracts and relevant behavior tests, source architecture rules, Free-First policy, display-fit non-regression, storage/lifecycle requirements, obvious security boundaries, Android packaged assets, Gradle lint, APK integrity and final evidence. A failing blocker returns **CHANGES REQUIRED** and prevents APK publication. Passing all implemented blocking checks returns **APPROVED**; advisory ideas remain non-blocking and Premium/Later items cannot block the free core.

## Definition of Free-Core Complete

The free core is complete only when Tasks 1–9 are implemented to their stated truthful scope, all tests run without a skip, Agent Sahab returns APPROVED, Android lint/build pass, APK inspection passes, and the audited APK artifact exists. Premium/cloud AI, proprietary Office conversion engines and other paid services are separate future work and are not part of this completion definition.
