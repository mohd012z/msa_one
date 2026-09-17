# MSA One Create Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Create UI into a persistent local Create Studio, with functional Document and Smart HTML editors first and prepared shells for Spreadsheet, Presentation and PDF.

**Architecture:** Keep the existing single-page MSA One shell and add focused Create Studio CSS/JS modules injected by the existing build workflow. A local project store owns draft metadata/content and recovery; the editor shell switches toolbars by document type. Document and Smart HTML support real editing/preview/export in phase 1; heavier office formats remain explicit prepared modules rather than fake generation.

**Tech Stack:** HTML/CSS/vanilla JavaScript, localStorage/IndexedDB-compatible local persistence, Blob/download/share browser APIs, Capacitor Android shell, Node contract tests, GitHub Actions.

**Spec:** Approved in chat on 2026-09-18.

## Global Constraints
- Preserve the current premium dark MSA One theme and Button Studio.
- Mobile-first and iPhone/Android safe-area aware.
- Autosave locally and restore recent drafts after app restart.
- Do not claim DOCX/XLSX/PPTX/PDF generation until its real engine exists.
- Keep the special circular + Create and smaller AI Lens controls.

---

### Task 1: Create Studio shell and routing
**Files:** Create `www/create-studio.css`, `www/create-studio.js`; Test `tests/create-studio.test.mjs`.
**Interfaces:** Produces `MSAStudio.open(type)`, `MSAStudio.close()`, and a shared editor overlay.
- [ ] Write failing contract test for five Create types, overlay, editor toolbar and safe-area layout.
- [ ] Run test and confirm failure.
- [ ] Implement Create Studio launcher and shared editor shell.
- [ ] Run tests and commit.

### Task 2: Local draft store and recovery
**Files:** Create `www/project-store.js`; update `www/create-studio.js`; update test.
**Interfaces:** Produces `MSAProjectStore.save/get/list/remove`; Create Studio consumes it.
- [ ] Write failing tests for draft metadata, autosave and recovery hooks.
- [ ] Implement local project persistence with stable IDs and timestamps.
- [ ] Add autosave status and recent-project recovery.
- [ ] Run tests and commit.

### Task 3: Functional Document editor
**Files:** Update `www/create-studio.js`, `www/create-studio.css`; update test.
**Interfaces:** Consumes project store; produces editable rich-text draft and HTML/text export/share.
- [ ] Add failing editor/export contract tests.
- [ ] Implement title, contenteditable body, basic formatting, autosave and preview.
- [ ] Implement honest HTML/text export/share fallback.
- [ ] Run tests and commit.

### Task 4: Functional Smart HTML editor
**Files:** Update `www/create-studio.js`, `www/create-studio.css`; update test.
**Interfaces:** Consumes project store; produces source editor, sandboxed preview and `.html` export.
- [ ] Add failing source/preview/export contract tests.
- [ ] Implement HTML source workspace and sandboxed live preview.
- [ ] Add responsive preview modes and HTML export.
- [ ] Run tests and commit.

### Task 5: Prepared office-format shells
**Files:** Update `www/create-studio.js`; update test.
**Interfaces:** Spreadsheet, Presentation and PDF use shared editor shell with truthful module status.
- [ ] Test that each type routes correctly and does not claim unsupported generation.
- [ ] Add format-specific toolbar placeholders and import/engine status.
- [ ] Run tests and commit.

### Task 6: Build integration and verification
**Files:** Modify `.github/workflows/build-apk.yml` if required; update tests.
**Interfaces:** Workflow injects/ships all Create Studio assets.
- [ ] Ensure Node tests cover Create Studio assets.
- [ ] Verify theme/settings tests remain green.
- [ ] Build Android debug APK.
- [ ] Verify artifact upload and report exact workflow result.