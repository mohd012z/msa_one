# MSA One Build 55 UI Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate MSA One into one coherent mobile-first shell with truthful actions, consistent 48 px interaction targets, simpler Home/Files/AI flows, and preserved working storage, Office, native-file, PDF, security, planner-data, and local-AI engines.

**Architecture:** Keep existing engines and replace presentation fragmentation with one `MSAAppShell` navigation contract. Add focused UI modules for shared tokens/icons, a Create Action Hub, provider-based Search Center, and capability-state routing; migrate Planner, Tools, Files, Home, AI, Library/Me entry points onto that shell without changing underlying document or storage formats.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node.js 22 test runner, Capacitor 7.4.3, Android/Java 21 build pipeline.

**Spec:** `docs/superpowers/specs/2026-10-04-build55-ui-consolidation-design.md`

## Global Constraints

- Preserve Android application ID `com.msa.one.displayfit37`.
- Preserve Capacitor `7.4.3` pins unless a separate dependency change is approved.
- Do not rewrite `MSAProjects`, `MSAStorage`, Office engines, import/export engines, native file bridge, native PDF renderer, security engine, planner storage schema, or local AI engine.
- Do not claim built-in OCR when no OCR engine exists.
- Premium billing remains inactive.
- No critical action may depend only on long press or swipe.
- Minimum phone interactive target is 48 × 48 CSS px equivalent.
- Scanner V2, full local content indexing, and MyAI/Lola workbench integration are out of scope for this first Build 55 merge.
- Existing safe-area, Android back, security, storage recovery, Office import/export, PDF and update-policy behavior must remain green.
- Build 54 `main` remains untouched until this branch passes Build 55 verification.

## Review Focus

1. **Malformed fourth-tab preference:** fall back to `myday` and keep navigation usable. Task 2.
2. **Unavailable page/module:** recover to Home with visible feedback instead of a blank page. Task 2.
3. **Available tool without implementation:** fail audit until state or route is corrected. Task 6.
4. **Malformed/duplicate Search results:** ignore bad entries, deduplicate IDs and continue rendering valid providers. Task 5.
5. **Narrow phone + safe-area insets:** required controls remain reachable, ≥48 px and clear of system bars. Tasks 1 and 10.

---

## File Structure

### Create

- `www/ui-system.css` — shared Build 55 visual, spacing, focus and 48 px touch tokens.
- `www/icon-system.js` — local SVG icon registry; no remote icon/font dependency.
- `www/action-hub.js` — center `+` multifunction Create sheet.
- `tests/build55-ui-system.test.mjs`
- `tests/build55-shell.test.mjs`
- `tests/build55-action-hub.test.mjs`
- `tests/build55-search.test.mjs`
- `tests/build55-tools-actions.test.mjs`
- `tests/build55-surfaces.test.mjs`
- `tests/build55-office.test.mjs`

### Modify

- `www/index.html`
- `www/app-shell.js`
- `www/workspace-v2.css`
- `www/mobile-quality.js`
- `www/settings-v2.js`
- `www/planner.js`, `www/planner.css`
- `www/search-center.js`
- `www/action-registry.js`
- `www/tools-catalog.js`, `www/tools-center.js`
- `www/drawer.js`
- `www/home-v2.js`
- `www/files-v2.js`
- `www/ai-tools.js`
- `www/create-v2.js`
- `www/library-engine.js`
- `www/office-mobile.css`, `www/office-mobile.js`
- `package.json`
- `www/app-manifest.js`
- `capacitor.config.json`
- `.github/workflows/build-apk.yml`
- `README.md`
- `tests/action-registry.test.mjs`
- `tests/build-consistency.test.mjs`

---

### Task 1: Shared UI Tokens, Local SVG Icons and 48 px Quality Contract

**Files:**
- Create: `www/ui-system.css`
- Create: `www/icon-system.js`
- Create: `tests/build55-ui-system.test.mjs`
- Modify: `www/workspace-v2.css`
- Modify: `www/mobile-quality.js`
- Modify: `www/index.html`
- Modify: `package.json`

**Interfaces:**
- Consumes: `--safe-top`, `--native-safe-top`, `--native-safe-bottom`.
- Produces: `--msa-touch-min:48px`, shared surface/text/semantic/focus/spacing/radius tokens; `MSAIcons.svg(id,{label})`; `MSAMobileQuality.MIN_TOUCH_TARGET === 48`.

- [ ] **Step 1: Write failing tests** asserting token load order, `--msa-touch-min:48px`, local icon registry, accessible icon output, and `MIN_TOUCH_TARGET === 48`.
- [ ] **Step 2: Run** `node --test tests/build55-ui-system.test.mjs tests/mobile-quality.test.mjs` and confirm FAIL.
- [ ] **Step 3: Implement** `ui-system.css`, `icon-system.js`, 48 px diagnostics, and migrate high-frequency workspace controls to shared tokens while preserving safe-area calculations.
- [ ] **Step 4: Add** `node --check www/icon-system.js` to `package.json` and load the icon registry before modules that consume it.
- [ ] **Step 5: Run** `npm run check:syntax && node --test tests/build55-ui-system.test.mjs tests/mobile-quality.test.mjs`; expect PASS.
- [ ] **Step 6: Commit** `feat(ui): add Build 55 shared tokens and icon system`.

---

### Task 2: Single AppShell Navigation, Page Registry, Fourth Tab and Back Contract

**Files:**
- Create: `tests/build55-shell.test.mjs`
- Modify: `www/app-shell.js`
- Modify: `www/workspace-v2.css`
- Modify: `www/settings-v2.js`

**Interfaces:**
- Produces:
  - `MSAAppShell.registerPage({id,title,kind,parent,render})`
  - `MSAAppShell.open(id, options={})`
  - `MSAAppShell.back()`
  - `MSAAppShell.getFourthTab()`
  - `MSAAppShell.setFourthTab(id)` with allowed values `myday`, `tools`, `library`.

- [ ] **Step 1: Write failing shell tests** for default destinations `home/files/create/myday/ai`, malformed preference fallback to `myday`, allowed fourth-tab values, title-aware top bar, accessible icon buttons, wide navigation rail, and unknown-page fallback to Home.
- [ ] **Step 2: Run** `node --test tests/build55-shell.test.mjs`; confirm FAIL.
- [ ] **Step 3: Refactor** `app-shell.js` so normal pages register descriptors and `MSAAppShell` owns active navigation state while retaining compatibility with existing `open(id)` callers.
- [ ] **Step 4: Implement** fourth-tab persistence with one Build 55 key and `MSAStorage.mirror` when available; add exactly My Day/Tools/Library choices in Settings.
- [ ] **Step 5: Run** `node --test tests/build55-shell.test.mjs tests/button-studio.test.mjs`; expect PASS.
- [ ] **Step 6: Commit** `feat(shell): consolidate Build 55 navigation and page registry`.

---

### Task 3: Planner / My Day Integration

**Files:**
- Create: `tests/build55-surfaces.test.mjs`
- Modify: `www/planner.js`
- Modify: `www/planner.css`

**Interfaces:**
- Consumes: `MSAAppShell.registerPage`, `MSAAppShell.open` and existing `msaOnePlannerV1` data.
- Produces: page ID `myday`; `MSAPlanner.todaySummary() -> {count,next}` without changing storage format.

- [ ] **Step 1: Write failing tests** asserting Planner no longer reads/inserts into legacy `.nav`, registers `myday`, exports `todaySummary()`, and retains existing storage key/CRUD behavior.
- [ ] **Step 2: Run** `node --test tests/build55-surfaces.test.mjs tests/calendar-visibility.test.mjs`; confirm Build 55 assertions FAIL.
- [ ] **Step 3: Remove** `addNavigationShortcut()` and six-column legacy navigation mutation; register My Day with AppShell and add pure `todaySummary()`.
- [ ] **Step 4: Align** Planner controls/sheets with shared touch and safe-area tokens without rewriting planner data logic.
- [ ] **Step 5: Run** `node --test tests/build55-surfaces.test.mjs tests/calendar-visibility.test.mjs`; expect PASS.
- [ ] **Step 6: Commit** `feat(planner): integrate My Day with central app shell`.

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
- Produces: `MSAActionHub.open()`, `close()`, `run(actionId)`.

- [ ] **Step 1: Write failing tests** for visible actions: document, spreadsheet, presentation, PDF, Smart HTML, scan, open file, import folder, create with AI, templates, plus an expanded Create-page path.
- [ ] **Step 2: Run** `node --test tests/build55-action-hub.test.mjs`; confirm FAIL.
- [ ] **Step 3: Implement** Action Hub as a focused bottom sheet routing only to existing engines; do not add OCR/scanner-v2/indexing behavior.
- [ ] **Step 4: Change** center `+` to open the Action Hub; keep Create V2 as browse/expanded destination.
- [ ] **Step 5: Add syntax/load checks** and run `npm run check:syntax && node --test tests/build55-action-hub.test.mjs tests/build55-shell.test.mjs`; expect PASS.
- [ ] **Step 6: Commit** `feat(create): add multifunction Create Action Hub`.

---

### Task 5: Search Center V2 Providers, Filters and Commands

**Files:**
- Create: `tests/build55-search.test.mjs`
- Modify: `www/search-center.js`

**Interfaces:**
- Produces:
  - `MSASearchCenter.registerProvider({id,label,search})`
  - `MSASearchCenter.search(query,{kind='all'})`
  - normalized result `{id,kind,icon,title,subtitle,score,action}`.

- [ ] **Step 1: Write failing tests** for providers Files/Tools/Templates/AI/Calendar/Actions, exact filters All/Files/Tools/Templates/AI/Calendar/Actions, and commands New Document/Scan/Import/Backup/Settings/Open My Day.
- [ ] **Step 2: Add tests** proving malformed results are ignored, duplicate IDs deduplicate, and one provider throwing does not suppress other results.
- [ ] **Step 3: Run** `node --test tests/build55-search.test.mjs`; confirm FAIL.
- [ ] **Step 4: Refactor** existing title/catalog search into providers, add planner-metadata and application-action providers, and centralize normalization/ranking/deduplication.
- [ ] **Step 5: Add filter-chip UI** using shared geometry; do not claim full document-content indexing.
- [ ] **Step 6: Run** `node --test tests/build55-search.test.mjs tests/build55-ui-system.test.mjs`; expect PASS.
- [ ] **Step 7: Commit** `feat(search): add Build 55 provider command center`.

---

### Task 6: Truthful Action Registry, Tools States and Drawer

**Files:**
- Create: `tests/build55-tools-actions.test.mjs`
- Modify: `www/action-registry.js`
- Modify: `tests/action-registry.test.mjs`
- Modify: `www/tools-catalog.js`
- Modify: `www/tools-center.js`
- Modify: `www/drawer.js`

**Interfaces:**
- Registry record: `{id,label,area,selector,impl,state,destructive}`.
- Tool states: `Available | Limited | Planned | Requires file | Desktop companion`.
- `MSAActionRegistry.audit()` reports missing/mismatched implementations.

- [ ] **Step 1: Write failing tests** requiring every Available entry to have a callable route and Planned/Limited entries not to masquerade as Available.
- [ ] **Step 2: Pin known corrections:** File Compressor = Planned unless implemented; OCR wording/state must not claim built-in recognition; QR drawer item absent without QR workflow; Library/Update/Security labels must match actual behavior.
- [ ] **Step 3: Run** `node --test tests/action-registry.test.mjs tests/build55-tools-actions.test.mjs`; confirm FAIL.
- [ ] **Step 4: Upgrade** registry shape/audit and tool-card state rendering; eliminate generic “prepared” fallback for cards styled Available.
- [ ] **Step 5: Route** Update Status to existing update-policy diagnostics/status surface rather than Premium; Security Status to existing security diagnostics; rename Library-related drawer entries to what they actually open.
- [ ] **Step 6: Run** `node --test tests/action-registry.test.mjs tests/build55-tools-actions.test.mjs`; expect PASS.
- [ ] **Step 7: Commit** `fix(actions): make tools and drawer capability states truthful`.

---

### Task 7: Task-First Home

**Files:**
- Modify: `www/home-v2.js`
- Modify: `tests/build55-surfaces.test.mjs`

**Interfaces:**
- Consumes: `MSAPlanner.todaySummary()`, Search Center, Action Hub, project list.
- Produces Home order: Search/Ask → Continue Working → My Day → Quick Actions → optional For You.

- [ ] **Step 1: Add failing assertions** for section order, My Day summary and exactly four primary quick actions: New Document, Scan, Import, Ask AI.
- [ ] **Step 2: Run** `node --test tests/build55-surfaces.test.mjs`; confirm FAIL.
- [ ] **Step 3: Refactor** Home presentation while preserving recent-project opening and existing catalogs; route shared actions through Build 55 modules.
- [ ] **Step 4: Run** `node --test tests/build55-surfaces.test.mjs`; expect PASS.
- [ ] **Step 5: Commit** `feat(home): simplify Build 55 task-first workspace`.

---

### Task 8: Files Filters and Context Actions

**Files:**
- Modify: `www/files-v2.js`
- Modify: `tests/build55-surfaces.test.mjs`

**Interfaces:**
- Consumes existing `MSAFiles` and `MSAActionSheet` implementations.
- Produces truthful visible filters and one normalized overflow action set.

- [ ] **Step 1: Add failing assertions** that no visible IMG/OTHER filter silently resets to All, and each visible filter has real semantics or is omitted.
- [ ] **Step 2: Pin overflow actions** Open, Ask AI, Rename, Duplicate, Export/Save Copy, Properties, Delete; Convert only when a real conversion path exists; Delete remains destructive.
- [ ] **Step 3: Run** `node --test tests/build55-surfaces.test.mjs tests/files-workspace.test.mjs`; confirm Build 55 assertions FAIL.
- [ ] **Step 4: Implement** truthful filtering/action presentation; keep Device/Downloads/Folder/Re-scan behavior and do not invent Move/Pin/Share backends.
- [ ] **Step 5: Run** `node --test tests/build55-surfaces.test.mjs tests/files-workspace.test.mjs`; expect PASS.
- [ ] **Step 6: Commit** `fix(files): align filters and actions with real behavior`.

---

### Task 9: Simplified AI Workspace with Explicit Modes

**Files:**
- Modify: `www/ai-tools.js`
- Modify: `tests/build55-surfaces.test.mjs`

**Interfaces:**
- Produces mode IDs `general`, `document`, `technical`, `coding`; composer with File/Camera/Voice/Start.

- [ ] **Step 1: Add failing assertions** for four modes, attachment controls, reduced repeated assistant rows, and no primary “Add Your Assistant” action unless clearly Planned.
- [ ] **Step 2: Assert** local/offline status remains explicit and no connected model is falsely claimed.
- [ ] **Step 3: Run** `node --test tests/build55-surfaces.test.mjs tests/ai-engine.test.mjs tests/ai-reader.test.mjs`; confirm Build 55 assertions FAIL.
- [ ] **Step 4: Refactor** AI presentation only; map current assistant prompts into secondary presets/mode seeds and leave extraction/local AI engines unchanged.
- [ ] **Step 5: Run** the same command; expect PASS.
- [ ] **Step 6: Commit** `feat(ai): simplify workspace around composer and modes`.

---

### Task 10: Office Mobile Touch, Density and Central Return

**Files:**
- Create: `tests/build55-office.test.mjs`
- Modify: `www/office-mobile.css`
- Modify: `www/office-mobile.js`

**Interfaces:**
- Consumes existing Create Studio/Office actions and `MSAAppShell` return destination.
- Produces compliant 48 px ribbon/sheet controls and one editor close/back path.

- [ ] **Step 1: Write failing tests** for ≥48 px Office Home/icon/ribbon/More-sheet/presentation controls, safe-area variables and no active legacy-nav manipulation.
- [ ] **Step 2: Test narrow-screen policy:** reduce simultaneous controls or move lower-frequency actions into More Options rather than shrinking below 48 px.
- [ ] **Step 3: Run** `node --test tests/build55-office.test.mjs tests/create-studio.test.mjs`; confirm FAIL on Build 54 44 px controls.
- [ ] **Step 4: Update** Office mobile geometry and More Options placement while preserving document rendering/data logic and drag-down behavior.
- [ ] **Step 5: Normalize** close/back through a helper that returns via `MSAAppShell` when available, with existing fallback behavior retained.
- [ ] **Step 6: Run** `node --test tests/build55-office.test.mjs tests/create-studio.test.mjs`; expect PASS.
- [ ] **Step 7: Commit** `fix(office): normalize mobile ribbon targets and back flow`.

---

### Task 11: Remaining Normal-Page Shell Consolidation

**Files:**
- Modify: `www/index.html`
- Modify: `www/library-engine.js`
- Modify: `www/settings-v2.js`
- Modify: `www/create-v2.js`
- Modify: `www/drawer.js`
- Modify: `tests/build55-shell.test.mjs`

**Interfaces:**
- Consumes central AppShell registration/open/back APIs.
- Produces no active Build 55 feature module that owns/mutates a competing legacy navigation bar.

- [ ] **Step 1: Add failing assertions** that Planner/Drawer/Library/Settings/Create do not insert legacy nav destinations and normal pages use AppShell entry/return paths.
- [ ] **Step 2: Run** `node --test tests/build55-shell.test.mjs tests/build55-surfaces.test.mjs`; confirm FAIL on remaining active legacy assumptions.
- [ ] **Step 3: Migrate** remaining normal-page navigation while retaining dormant legacy markup only where removal would create unnecessary risk.
- [ ] **Step 4: Run** the same test command; expect PASS.
- [ ] **Step 5: Commit** `refactor(shell): remove active legacy navigation dependencies`.

---

### Task 12: Build 55 Metadata, CI and Whole-Branch Verification

**Files:**
- Modify: `package.json`
- Modify: `www/app-manifest.js`
- Modify: `capacitor.config.json`
- Modify: `.github/workflows/build-apk.yml`
- Modify: `www/index.html`
- Modify: `README.md`
- Modify: `tests/build-consistency.test.mjs`

**Interfaces:**
- Produces consistent Build 55 source/package/Android metadata and CI artifact contract.

- [ ] **Step 1: Update consistency tests first** to expect package/app version `55.0.0`, build ID `MSA-ONE-55`, Android `versionCode 55`, `versionName "55.0"`, app name `MSA One 55`, artifact `MSA-One-55-APK`, unchanged app ID, and packaged `ui-system.css`, `icon-system.js`, `action-hub.js`.
- [ ] **Step 2: Run** `node --test tests/build-consistency.test.mjs`; confirm FAIL while source metadata is still Build 54.
- [ ] **Step 3: Update** package/manifest/Capacitor/workflow/UI marker/README metadata consistently without changing app ID, billing state, security hardening or native bridge/PDF contracts.
- [ ] **Step 4: Run** `npm test`; expect all source suites PASS.
- [ ] **Step 5: Verify source invariants:** no `repeat(6,1fr)` Planner nav mutation; no Available tool routed to generic “prepared” fallback; no primary Build 55 touch contract below 48 px; no built-in OCR claim.
- [ ] **Step 6: Push and require existing PR CI** to pass source contracts, dependency install, Android generation/sync, hardening, packaged-assets verification, `lintDebug`, `assembleDebug`, and artifact upload.
- [ ] **Step 7: Run runtime smoke matrix:** phone portrait/landscape; Home/Create Hub; Files filters/actions; My Day CRUD/undo; Search providers/actions; AI attachments/modes; Office import/save/export/More/back; native PDF; Drawer/Settings fourth-tab persistence/fallback; runtime diagnostics with zero visible primary controls below 48 px.
- [ ] **Step 8: Commit** `chore(release): finalize MSA One 55 UI consolidation`.

---

## Final Merge Gate

PR #15 may move from draft toward merge only after:

- `npm test` is green.
- GitHub Actions source contracts are green.
- Android lint and debug APK build are green.
- `MSA-One-55-APK` is produced.
- Android application ID remains unchanged.
- Premium billing remains disabled in the normal APK.
- Security hardening, native file/folder bridge and native PDF checks remain green.
- No active normal-page module owns competing legacy navigation.
- Every primary Available action has a real route.
- Every visible primary phone control meets the 48 px contract.
- Unsupported OCR/compression/etc. are Limited/Planned rather than presented as complete.
- Build 54 `main` remains unchanged until review/merge.
