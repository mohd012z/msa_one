# MSA One Build 55 UI Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate MSA One into one coherent, mobile-first application shell with truthful actions, consistent 48 px interaction targets, simpler Home/Files/AI flows, and preserved working storage, Office, native-file, PDF, security, planner-data, and local-AI engines.

**Architecture:** Keep the existing engines and replace presentation fragmentation with one `MSAAppShell` navigation contract. Add focused UI modules for shared tokens, Create Action Hub, Search Center providers, and capability-state routing; migrate Planner, Tools, Files, Home, AI, Library/Me entry points onto that shell without changing their underlying data formats.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node.js 22 test runner, Capacitor 7.4.3, Android/Java 21 build pipeline.

**Spec:** `docs/superpowers/specs/2026-10-04-build55-ui-consolidation-design.md`

## Global Constraints

- Preserve Android application ID `com.msa.one.displayfit37` for in-place upgrades.
- Preserve Capacitor `7.4.3` pins unless a separate dependency change is explicitly approved.
- Do not rewrite `MSAProjects`, `MSAStorage`, Office document engines, import/export engines, native Android file bridge, native PDF renderer, security engine, planner storage schema, or local AI engine.
- Do not claim built-in OCR when no recognition engine exists.
- Premium billing remains inactive.
- No critical action may depend only on long press or swipe.
- Minimum phone interactive target is 48 × 48 CSS px equivalent.
- Scanner V2, full local document-content indexing, and MyAI/Lola workbench integration remain out of scope for this first Build 55 merge.
- Existing safe-area, Android back, security, storage recovery, Office import/export, PDF, and update-policy behavior must remain green.
- Build 54 `main` remains untouched until this branch passes the Build 55 regression gates.

## Review Focus

1. **Malformed fourth-tab preference** — startup must fall back to `myday` rather than hiding or breaking navigation. Covered in Task 2.
2. **Unavailable registered page/module** — shell navigation must recover to Home and provide visible feedback rather than leaving a blank page. Covered in Task 2.
3. **Tool marked Available without a callable action** — tests must fail until the catalog state or implementation is corrected. Covered in Task 6.
4. **Search provider returns malformed/duplicate results** — Search Center must normalize, deduplicate, and ignore invalid results without breaking the panel. Covered in Task 5.
5. **Narrow phone/editor with oversized labels or safe-area insets** — required controls must remain reachable, at least 48 px, and not overlap system bars. Covered in Tasks 3 and 10.

---

## File Structure Map

### New files

- `www/ui-system.css` — Build 55 visual/touch tokens and shared component geometry.
- `www/action-hub.js` — center `+` multifunction Create Action Hub only.
- `tests/build55-shell.test.mjs` — shell, navigation, page-registration and fourth-tab contracts.
- `tests/build55-ui-system.test.mjs` — token, touch-target and shared UI contracts.
- `tests/build55-action-hub.test.mjs` — Action Hub routing contract.
- `tests/build55-search.test.mjs` — provider/result/filter/command Search Center contract.
- `tests/build55-tools-actions.test.mjs` — capability-state and action-registry truth contract.
- `tests/build55-surfaces.test.mjs` — Home, Files, Planner and AI presentation contracts.
- `tests/build55-office.test.mjs` — Office ribbon touch/density/back-contract checks.

### Modified files

- `www/app-shell.js` — single navigation owner, page registry, fourth-tab preference, fallback/back contract.
- `www/workspace-v2.css` — consume shared tokens; bottom bar / rail / header geometry.
- `www/index.html` — load Build 55 assets and stop active feature modules from depending on legacy navigation.
- `www/mobile-quality.js` — enforce 48 px minimum and accessibility/status checks.
- `www/planner.js` / `www/planner.css` — register as `myday`; stop mutating legacy `.nav`; adopt shared shell geometry.
- `www/search-center.js` — provider-based Search Center V2 and command/filter support.
- `www/action-registry.js` — stable action IDs, capability state, destructive metadata and runtime audit.
- `www/tools-catalog.js` / `www/tools-center.js` — truthful capability states and matching routes.
- `www/drawer.js` — remove/rename misleading parallel navigation.
- `www/home-v2.js` — shorter task-first Home and My Day summary.
- `www/files-v2.js` — truthful filters and normalized file action routing.
- `www/ai-tools.js` — simpler composer + mode chips; remove primary fake/placeholder action.
- `www/office-mobile.css` / `www/office-mobile.js` — 48 px controls, narrow-screen density and central back return.
- `www/create-v2.js` — expanded browse path remains, while fast-create uses Action Hub.
- `www/settings-v2.js` — fourth-tab preference control.
- `package.json` — syntax checks for new JS module and final Build 55 version.
- `www/app-manifest.js`, `capacitor.config.json`, `.github/workflows/build-apk.yml`, `README.md`, `tests/build-consistency.test.mjs` — final Build 55 release metadata and packaging contracts.

---

### Task 1: Shared Build 55 UI System and 48 px Quality Contract

**Files:**
- Create: `www/ui-system.css`
- Create: `tests/build55-ui-system.test.mjs`
- Modify: `www/workspace-v2.css`
- Modify: `www/mobile-quality.js`
- Modify: `www/index.html`

**Interfaces:**
- Consumes: existing CSS variables including `--safe-top`, `--native-safe-top`, `--native-safe-bottom`.
- Produces: shared CSS tokens `--msa-touch-min:48px`, surface/text/semantic colors, spacing/radius tokens; `MSAMobileQuality.MIN_TOUCH_TARGET === 48`.

- [ ] **Step 1: Write failing UI-system tests**
  - Assert `index.html` loads `ui-system.css` before `workspace-v2.css`.
  - Assert `ui-system.css` declares `--msa-touch-min:48px` and shared focus/semantic/touch tokens.
  - Assert key shared selectors use at least the touch token rather than 36–44 px fixed interactive heights.
  - Assert `MSAMobileQuality.MIN_TOUCH_TARGET` equals `48` and touch checks compare against it.

- [ ] **Step 2: Run the focused tests and confirm failure**
  - Run: `node --test tests/build55-ui-system.test.mjs tests/mobile-quality.test.mjs`
  - Expected: FAIL because Build 55 tokens and 48 px quality constant do not yet exist.

- [ ] **Step 3: Implement the shared token layer**
  - Add `www/ui-system.css` with one token source for surfaces, text, accent, AI/warning/danger states, focus, spacing, radius and touch sizes.
  - Migrate `workspace-v2.css` high-frequency controls to shared tokens without changing page data behavior.
  - Expose `const MIN_TOUCH_TARGET=48` through `MSAMobileQuality` and use it in `touchTargetCheck()`.
  - Preserve existing safe-area calculations.

- [ ] **Step 4: Re-run focused tests**
  - Run: `node --test tests/build55-ui-system.test.mjs tests/mobile-quality.test.mjs`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - Commit message: `feat(ui): add Build 55 shared touch and visual system`

---

### Task 2: Single AppShell Navigation, Page Registry, Fourth Tab and Back Contract

**Files:**
- Create: `tests/build55-shell.test.mjs`
- Modify: `www/app-shell.js`
- Modify: `www/workspace-v2.css`
- Modify: `www/settings-v2.js`

**Interfaces:**
- Consumes: existing feature modules exposing `mount()` / `render()` functions and existing `MSAStorage.mirror` when available.
- Produces:
  - `MSAAppShell.registerPage({id,title,kind,parent,render})`
  - `MSAAppShell.open(id, options={})`
  - `MSAAppShell.back()`
  - `MSAAppShell.getFourthTab()`
  - `MSAAppShell.setFourthTab(id)` where allowed values are `myday`, `tools`, `library`.

- [ ] **Step 1: Write failing shell tests**
  - Assert default destinations are `home`, `files`, `create`, `myday`, `ai`.
  - Assert malformed stored fourth-tab values normalize to `myday`.
  - Assert only `myday`, `tools`, `library` are accepted by `setFourthTab()`.
  - Assert `topbarHTML(title)` renders the supplied title and icon-only controls have accessible names.
  - Assert unknown/unavailable page requests fall back to Home rather than leaving no active page.
  - Assert desktop/wide CSS uses the same destination model with a rail presentation.

- [ ] **Step 2: Run shell tests and confirm failure**
  - Run: `node --test tests/build55-shell.test.mjs`
  - Expected: FAIL because registry/fourth-tab/back interfaces do not yet exist.

- [ ] **Step 3: Refactor `app-shell.js` into the single normal-page navigation owner**
  - Keep current `MSAAppShell.open()` call compatibility.
  - Add page registration and destination descriptors rather than hardcoding module-specific render branches throughout `open()`.
  - Persist fourth-tab preference under one Build 55 key and mirror it when storage support is available.
  - Implement Home fallback for bad page IDs/modules.
  - Make the title argument visible in secondary/root header rendering.

- [ ] **Step 4: Add Settings control for fourth-tab choice**
  - Surface exactly three options: My Day, Tools, Library.
  - Use `MSAAppShell.setFourthTab()`; do not create a second navigation preference store.

- [ ] **Step 5: Run tests**
  - Run: `node --test tests/build55-shell.test.mjs tests/settings-v2.test.mjs`
  - Expected: PASS.

- [ ] **Step 6: Commit**
  - Commit message: `feat(shell): consolidate Build 55 navigation and page registry`

---

### Task 3: Planner/My Day Migration onto AppShell

**Files:**
- Modify: `www/planner.js`
- Modify: `www/planner.css`
- Modify: `tests/build55-surfaces.test.mjs` (create in this task)

**Interfaces:**
- Consumes: `MSAAppShell.registerPage(...)`, `MSAAppShell.open(id)`, existing `msaOnePlannerV1` records.
- Produces:
  - registered page ID `myday`;
  - `MSAPlanner.todaySummary()` returning `{count,next}` without changing planner storage format.

- [ ] **Step 1: Write failing Planner migration tests**
  - Assert `planner.js` no longer queries/inserts into legacy `.nav` or sets it to six columns.
  - Assert Planner registers/opens through page ID `myday`.
  - Assert `todaySummary()` exists and derives count/next item without writing data.
  - Assert Planner interactive controls use shared 48 px geometry and safe-area tokens.

- [ ] **Step 2: Run tests and confirm failure**
  - Run: `node --test tests/build55-surfaces.test.mjs`
  - Expected: FAIL on legacy navigation and missing summary interface.

- [ ] **Step 3: Migrate Planner navigation only**
  - Remove `addNavigationShortcut()` and direct legacy navigation mutation.
  - Register Planner as `myday` with parent `home`.
  - Preserve `msaOnePlannerV1`, editor CRUD, undo behavior and rendering logic.
  - Add pure `todaySummary()` helper for Home.

- [ ] **Step 4: Align Planner CSS with shared shell/touch/safe-area tokens**
  - Ensure month arrows, Today, Add, close, Save/Delete and date cells have compliant reachable hit areas.

- [ ] **Step 5: Run tests**
  - Run: `node --test tests/build55-surfaces.test.mjs tests/planner*.test.mjs`
  - Expected: PASS for all existing planner tests present in the repository plus Build 55 surface contract.

- [ ] **Step 6: Commit**
  - Commit message: `feat(planner): integrate My Day with central app shell`

---

### Task 4: Multifunction Create Action Hub

**Files:**
- Create: `www/action-hub.js`
- Create: `tests/build55-action-hub.test.mjs`
- Modify: `www/app-shell.js`
- Modify: `www/create-v2.js`
- Modify: `www/index.html`
- Modify: `package.json`

**Interfaces:**
- Consumes: `MSAStudio.open(type)`, `MSAActions.runAction('scan')`, `MSAFiles.importOfficeFile()`, `MSAFiles.importFolder(false)`, `MSAAIWorkspace.openPrompt()`, `MSAAppShell.open('templates')`.
- Produces: `MSAActionHub.open()`, `MSAActionHub.close()`, `MSAActionHub.run(actionId)`.

- [ ] **Step 1: Write failing Action Hub contract tests**
  - Assert center Create nav invokes `MSAActionHub.open()` rather than directly navigating to Create.
  - Assert action IDs exist for document, spreadsheet, presentation, PDF, Smart HTML, scan, open file, import folder, create with AI and templates.
  - Assert every critical action has a visible button and no critical action is long-press-only.
  - Assert full Create page remains accessible as the expanded browse path.

- [ ] **Step 2: Run tests and confirm failure**
  - Run: `node --test tests/build55-action-hub.test.mjs`
  - Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement `action-hub.js` as a focused bottom-sheet router**
  - Reuse shared action-sheet/scrim conventions where practical.
  - Route actions only to existing engines; do not add scanner/OCR/content-index behavior.
  - Keep `create-v2.js` as the browse/expanded Create destination.

- [ ] **Step 4: Wire module loading and syntax checks**
  - Load `action-hub.js` before `app-shell.js` uses it.
  - Add `node --check www/action-hub.js` to `package.json`.

- [ ] **Step 5: Run tests**
  - Run: `npm run check:syntax && node --test tests/build55-action-hub.test.mjs tests/build55-shell.test.mjs`
  - Expected: PASS.

- [ ] **Step 6: Commit**
  - Commit message: `feat(create): add multifunction Create Action Hub`

---

### Task 5: Search Center V2 Provider Model, Filters and Commands

**Files:**
- Create: `tests/build55-search.test.mjs`
- Modify: `www/search-center.js`

**Interfaces:**
- Consumes: project list, tool catalog, template catalog, AI catalog, planner records, Action Hub/shell/app actions.
- Produces:
  - `MSASearchCenter.registerProvider({id,label,search})`
  - `MSASearchCenter.search(query,{kind='all'})`
  - normalized result `{id,kind,icon,title,subtitle,score,action}`.

- [ ] **Step 1: Write failing provider/search tests**
  - Assert built-in provider IDs for files, tools, templates, AI, calendar and actions.
  - Assert filter set is exactly All, Files, Tools, Templates, AI, Calendar, Actions.
  - Assert direct commands include New Document, Scan, Import, Backup, Settings and Open My Day.
  - Assert malformed results are ignored, duplicate IDs are deduplicated, and provider exceptions do not break remaining results.
  - Assert no test or UI claims full document-content indexing.

- [ ] **Step 2: Run tests and confirm failure**
  - Run: `node --test tests/build55-search.test.mjs`
  - Expected: FAIL because provider registration/filter/command model does not yet exist.

- [ ] **Step 3: Refactor existing search into providers**
  - Keep current project/tool/template/AI scoring behavior where useful.
  - Add Planner metadata provider and direct action provider.
  - Centralize normalization, deduplication and sorting in Search Center.

- [ ] **Step 4: Update Search Center UI**
  - Add filter chips using shared token geometry.
  - Show recent/action results without requiring document-content indexing.
  - Preserve full-screen search and focus behavior.

- [ ] **Step 5: Run tests**
  - Run: `node --test tests/build55-search.test.mjs tests/build55-ui-system.test.mjs`
  - Expected: PASS.

- [ ] **Step 6: Commit**
  - Commit message: `feat(search): add Build 55 provider command center`

---

### Task 6: Truthful Action Registry, Tools States and Drawer Labels

**Files:**
- Create: `tests/build55-tools-actions.test.mjs`
- Modify: `www/action-registry.js`
- Modify: `tests/action-registry.test.mjs`
- Modify: `www/tools-catalog.js`
- Modify: `www/tools-center.js`
- Modify: `www/drawer.js`

**Interfaces:**
- Consumes: existing engine entry points.
- Produces:
  - registry records `{id,label,area,selector,impl,state,destructive}`;
  - tool state in finite set `Available | Limited | Planned | Requires file | Desktop companion`;
  - `MSAActionRegistry.audit()` reporting state/implementation mismatches.

- [ ] **Step 1: Write failing truth-state tests**
  - Assert every `Available` registry/tool entry maps to a real routed implementation.
  - Assert Planned/Limited entries cannot be styled/reported as Available.
  - Assert File Compressor is Planned unless a real `compress` action exists.
  - Assert OCR is not represented as built-in recognition; label/state is truthful.
  - Assert IMG/OTHER or PDF-management names do not promise unsupported behavior.
  - Assert drawer has no QR action without QR workflow, Library Management does not imply plugin management when it only opens Library, Update Status does not route to Premium, and Security is labeled as status/diagnostics when appropriate.

- [ ] **Step 2: Run tests and confirm failure**
  - Run: `node --test tests/action-registry.test.mjs tests/build55-tools-actions.test.mjs`
  - Expected: FAIL on old registry shape and misleading catalog/drawer routes.

- [ ] **Step 3: Upgrade registry and runtime audit**
  - Preserve a readable static list for source-contract tests.
  - Add stable IDs, state, destructive metadata and runtime implementation validation.

- [ ] **Step 4: Correct Tools catalog/router and Drawer**
  - Render capability state visually.
  - Remove generic “prepared” behavior for cards represented as Available.
  - Rename/remove drawer entries so the visible label matches the action.

- [ ] **Step 5: Run tests**
  - Run: `node --test tests/action-registry.test.mjs tests/build55-tools-actions.test.mjs`
  - Expected: PASS.

- [ ] **Step 6: Commit**
  - Commit message: `fix(actions): make tools and drawer capability states truthful`

---

### Task 7: Task-First Home and My Day Summary

**Files:**
- Modify: `www/home-v2.js`
- Modify: `tests/build55-surfaces.test.mjs`

**Interfaces:**
- Consumes: `MSAPlanner.todaySummary()`, `MSASearchCenter.open()`, `MSAActionHub.open()`, project list and existing tool/template catalogs.
- Produces: shortened Home order: Search/Ask → Continue Working → My Day → Quick Actions → optional For You.

- [ ] **Step 1: Add failing Home assertions**
  - Assert Home section ordering matches the Build 55 spec.
  - Assert Quick Actions expose only New Document, Scan, Import and Ask AI as the primary four.
  - Assert My Day summary reads `MSAPlanner.todaySummary()` and opens `myday`.
  - Assert older long duplicated sections are not all rendered as primary Home blocks.

- [ ] **Step 2: Run test and confirm failure**
  - Run: `node --test tests/build55-surfaces.test.mjs`
  - Expected: FAIL against Build 54 Home composition.

- [ ] **Step 3: Refactor `home-v2.js` presentation only**
  - Preserve recent project opening and existing catalogs.
  - Route create/search/AI/My Day actions through shared Build 55 modules.
  - Do not add a new Home data store.

- [ ] **Step 4: Run tests**
  - Run: `node --test tests/build55-surfaces.test.mjs`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - Commit message: `feat(home): simplify Build 55 task-first workspace`

---

### Task 8: Files Filters and Context Actions Cleanup

**Files:**
- Modify: `www/files-v2.js`
- Modify: `tests/build55-surfaces.test.mjs`

**Interfaces:**
- Consumes: existing `MSAFiles` project/open/rename/duplicate/delete/export/import functions and `MSAActionSheet`.
- Produces: visible filters that have real semantics and one normalized file overflow action list.

- [ ] **Step 1: Add failing Files assertions**
  - Assert no visible IMG/OTHER filter silently maps to All.
  - Assert filter buttons correspond to actual filtering behavior or are omitted.
  - Assert file row tap/open route remains available.
  - Assert overflow has Open, Ask AI, Rename, Duplicate, Export/Save Copy, Properties, Delete.
  - Assert Convert is included only when a real conversion path is available.
  - Assert Delete remains explicitly destructive.

- [ ] **Step 2: Run test and confirm failure**
  - Run: `node --test tests/build55-surfaces.test.mjs`
  - Expected: FAIL on IMG/OTHER behavior.

- [ ] **Step 3: Implement truthful filter/action presentation**
  - Remove unsupported filter chips or implement exact type filtering from existing project descriptors; do not alias them to All.
  - Keep storage Device/Downloads/Folder/Re-scan rows but align to shared controls.
  - Do not invent Move/Pin/Share backends in this task.

- [ ] **Step 4: Run tests**
  - Run: `node --test tests/build55-surfaces.test.mjs tests/files*.test.mjs`
  - Expected: PASS for present repository Files tests plus Build 55 contract.

- [ ] **Step 5: Commit**
  - Commit message: `fix(files): align filters and file actions with real behavior`

---

### Task 9: Simplified AI Workspace with Explicit Modes

**Files:**
- Modify: `www/ai-tools.js`
- Modify: `tests/build55-surfaces.test.mjs`

**Interfaces:**
- Consumes: `MSAActions.openPicker`, voice action, local AI routing, existing assistant prompts.
- Produces: mode IDs `general`, `document`, `technical`, `coding`; primary composer with File/Camera/Voice entry points.

- [ ] **Step 1: Add failing AI assertions**
  - Assert mode chips exist for General, Document, Technical and Coding.
  - Assert composer keeps File, Camera/Scan and Voice access plus Start.
  - Assert assistant presets may seed mode/prompts but do not require repeated primary full-width Chat rows.
  - Assert “Add Your Assistant” is omitted or explicitly Planned rather than presented as a working primary action.
  - Assert local/offline status remains visible/derivable and no connected model is falsely claimed.

- [ ] **Step 2: Run test and confirm failure**
  - Run: `node --test tests/build55-surfaces.test.mjs`
  - Expected: FAIL on Build 54 assistant-list composition.

- [ ] **Step 3: Refactor `ai-tools.js` presentation**
  - Keep underlying file extraction, `MSAActions.runAction('start')`, voice and local AI engines unchanged.
  - Map existing assistant prompts into secondary presets or mode seed prompts.

- [ ] **Step 4: Run tests**
  - Run: `node --test tests/build55-surfaces.test.mjs tests/ai-engine.test.mjs tests/ai-reader.test.mjs`
  - Expected: PASS where those existing test files are present.

- [ ] **Step 5: Commit**
  - Commit message: `feat(ai): simplify workspace around composer and modes`

---

### Task 10: Office Mobile Ribbon Touch, Density and Shell Return

**Files:**
- Create: `tests/build55-office.test.mjs`
- Modify: `www/office-mobile.css`
- Modify: `www/office-mobile.js`

**Interfaces:**
- Consumes: existing Create Studio/Office commands and `MSAAppShell` return destination.
- Produces: compliant 48 px ribbon/action targets and one editor close/back route to the central shell.

- [ ] **Step 1: Write failing Office tests**
  - Assert `.office-home-btn`, `.office-icon-btn`, ribbon tool buttons, More-sheet close/actions and presentation controls meet shared 48 px minimum.
  - Assert narrow-screen rules reduce simultaneous controls rather than shrinking them below minimum.
  - Assert More Options drag-down remains available but every action inside it also has a visible button.
  - Assert Office close/back uses the documented central return path and does not manipulate legacy `.nav`.
  - Assert safe top/bottom variables remain in editor/ribbon/sheet geometry.

- [ ] **Step 2: Run tests and confirm failure**
  - Run: `node --test tests/build55-office.test.mjs`
  - Expected: FAIL on 44 px Build 54 ribbon controls.

- [ ] **Step 3: Update Office mobile geometry and narrow-screen density**
  - Increase hit regions without inflating icon size unnecessarily.
  - Move lower-frequency controls into More Options rather than creating horizontal overflow that hides required actions.
  - Preserve document rendering/data code.

- [ ] **Step 4: Normalize editor return/back behavior**
  - Route close/back through one helper that returns to the recorded origin/root via `MSAAppShell` when available and retains safe fallback behavior.

- [ ] **Step 5: Run tests**
  - Run: `node --test tests/build55-office.test.mjs tests/create-studio*.test.mjs tests/office*.test.mjs`
  - Expected: PASS for present repository Office/Create Studio tests plus Build 55 contract.

- [ ] **Step 6: Commit**
  - Commit message: `fix(office): normalize mobile ribbon targets and back flow`

---

### Task 11: Consolidate Legacy Entry Points and Normal-Page Shell Usage

**Files:**
- Modify: `www/index.html`
- Modify: `www/drawer.js`
- Modify: `www/library-engine.js`
- Modify: `www/settings-v2.js`
- Modify: `www/create-v2.js`
- Modify: `tests/build55-shell.test.mjs`

**Interfaces:**
- Consumes: central `MSAAppShell` page registration/open/back contract.
- Produces: no active Build 55 feature module mutates legacy `.nav`; Library/Me/Settings/Create browse paths enter/exit through shell APIs.

- [ ] **Step 1: Add failing shell consolidation assertions**
  - Assert active modules `planner.js`, `drawer.js`, `library-engine.js`, `settings-v2.js`, `create-v2.js` do not insert new legacy nav destinations.
  - Assert normal-page navigation uses `MSAAppShell.open()` or registration APIs.
  - Assert dormant legacy markup, if still retained for compatibility, is not the owner of active navigation state.

- [ ] **Step 2: Run tests and confirm failure**
  - Run: `node --test tests/build55-shell.test.mjs`
  - Expected: FAIL on any remaining active legacy assumptions.

- [ ] **Step 3: Migrate remaining normal-page entry/return paths**
  - Keep legacy markup only where removal would create unnecessary risk during Build 55.
  - Do not rewrite Library, Settings or Create data/business behavior.

- [ ] **Step 4: Run tests**
  - Run: `node --test tests/build55-shell.test.mjs tests/build55-surfaces.test.mjs`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - Commit message: `refactor(shell): remove active legacy navigation dependencies`

---

### Task 12: Build 55 Metadata, CI Packaging Contracts and Whole-Branch Verification

**Files:**
- Modify: `package.json`
- Modify: `www/app-manifest.js`
- Modify: `capacitor.config.json`
- Modify: `.github/workflows/build-apk.yml`
- Modify: `www/index.html`
- Modify: `README.md`
- Modify: `tests/build-consistency.test.mjs`

**Interfaces:**
- Consumes: all completed Build 55 UI modules and tests.
- Produces: consistent Build 55 source/package/Android metadata and CI artifact contract.

- [ ] **Step 1: Update consistency tests first**
  - Change expected app/package version to `55.0.0`, build ID to `MSA-ONE-55`, Android `versionCode 55`, `versionName "55.0"`, Capacitor app name `MSA One 55`, artifact `MSA-One-55-APK`.
  - Assert `com.msa.one.displayfit37` remains unchanged.
  - Assert `ui-system.css` and `action-hub.js` are loaded, syntax-checked where applicable and packaged by workflow verification.
  - Preserve Premium-disabled, security-hardening, native file/PDF and update-policy assertions.

- [ ] **Step 2: Run consistency test and confirm failure**
  - Run: `node --test tests/build-consistency.test.mjs`
  - Expected: FAIL while source metadata still says Build 54.

- [ ] **Step 3: Update Build 55 metadata consistently**
  - Update package, app manifest, Capacitor name, build-ID UI marker, workflow versionCode/versionName/artifact, README Build 55 notes.
  - Do not change Android application ID or activate billing.

- [ ] **Step 4: Run all source tests and syntax checks**
  - Run: `npm test`
  - Expected: all suites PASS.

- [ ] **Step 5: Run source-level anti-regression searches**
  - Confirm no active module reintroduces `repeat(6,1fr)` legacy Planner nav mutation.
  - Confirm no visible Available tool routes to the generic “prepared” fallback.
  - Confirm no Build 55 primary control contract uses a sub-48 px target.
  - Confirm no Build 55 UI copy claims built-in OCR.

- [ ] **Step 6: Push branch and let the existing pull-request workflow execute**
  - Required CI gates: source tests, source UI/security assumptions, dependency install, Capacitor Android generation/sync, Android hardening, packaged asset verification, `lintDebug`, `assembleDebug`, artifact upload.
  - Expected: every required job/step GREEN and artifact `MSA-One-55-APK` produced.

- [ ] **Step 7: Device/runtime smoke matrix before merge**
  - Phone portrait: Home → Create Hub → create document → close → Files.
  - Phone landscape: navigation reachable; top/bottom safe areas correct.
  - Planner: Home My Day summary → My Day → add/edit/delete/undo.
  - Search: query files/tools/actions/calendar; malformed/empty query remains stable.
  - Files: each visible filter behaves truthfully; overflow actions route correctly.
  - AI: attach readable local file, mode change, voice unsupported fallback, Start route.
  - Office: ribbon, More Options drag, import/save/export, close/back, PDF native path.
  - Drawer/Settings: labels match destinations; fourth-tab preference survives reload and bad value falls back safely.
  - Accessibility: runtime diagnostics report zero visible controls below 48 px on the tested primary screens.

- [ ] **Step 8: Commit final release metadata**
  - Commit message: `chore(release): finalize MSA One 55 UI consolidation`

---

## Final Review Gate

Before PR #15 is made ready for merge, verify all of the following:

- `npm test` is green.
- GitHub Actions source contracts are green.
- Android lint is green.
- Debug APK build is green.
- Packaged source includes every new Build 55 asset.
- Android application ID is unchanged.
- Premium billing remains disabled in the normal APK.
- Security hardening assertions remain green.
- Native folder/file bridge and native PDF viewer assertions remain green.
- No active normal-page module owns a competing legacy navigation bar.
- Every primary Available action has a real implementation path.
- Every visible primary phone control meets the 48 px interaction contract.
- Unsupported OCR/compression/etc. are labeled Limited/Planned rather than presented as complete.
- `main` is not changed until this branch satisfies the above gates and the PR is reviewed.
