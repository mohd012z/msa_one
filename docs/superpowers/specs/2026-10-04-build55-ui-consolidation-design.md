# MSA One Build 55 UI Consolidation Design

Date: 2026-10-04
Branch: `feat/build55-ui-consolidation`
Status: Approved design direction — Approach B

## 1. Goal

Build 55 will consolidate MSA One into one coherent mobile application shell without rewriting working storage, Office, import/export, native file, PDF, security, planner-data, or local AI engines.

The objective is to make MSA One materially easier to use on Android phones and tablets by reducing navigation duplication, aligning controls, standardizing touch targets, removing misleading actions, improving information hierarchy, and making common actions reachable in fewer steps.

Success means the app behaves like one product rather than several UI generations layered together.

## 2. Evidence from current Build 54

Current `main` uses multiple presentation layers at once:

- `www/index.html` still defines legacy Home, Files, Create, AI, Me, and `.nav` UI.
- `www/app-shell.js` installs Workspace V2 with `.ws-bottom` and replaces several page bodies.
- `www/planner.js` still injects Calendar into the hidden legacy `.nav` instead of registering with `MSAAppShell`.
- `www/office-mobile.js` / `www/office-mobile.css` provide a separate full-screen Office interaction shell.
- `www/workspace-v2.css` hides legacy `.nav` while `planner.js` still assumes it exists.

Current action behavior also contains several user-facing mismatches:

- Files displays IMG and OTHER filters but maps those selections back to `all`.
- Create → Convert currently launches the same file-import entry point as Open File rather than a true source→target conversion flow.
- `File Compressor` is present in `tools-catalog.js` but has no corresponding `compress` case in `tools-center.js`.
- `OCR Reader` currently routes to an AI prompt rather than a real OCR engine.
- Drawer entries such as QR / Import, Plug-in / Library Management, Update Center, Security Center, and OCR Center do not consistently match the action implied by their labels.
- Visible touch controls include 36–44 px targets while Android mobile guidance recommends at least 48 dp interactive targets.
- `mobile-quality.js` currently treats 44 px as the minimum touch target and therefore can report a control as acceptable even when it is smaller than the intended Build 55 standard.

Build 55 addresses these presentation and interaction issues first.

## 3. Non-goals

Build 55 UI consolidation will not:

- rewrite `MSAProjects`, `MSAStorage`, Office document engines, import/export engines, native Android file bridge, native PDF renderer, security engine, existing storage migrations, or core planner data storage;
- claim real OCR until a recognition engine exists;
- implement arbitrary cloud execution, hidden uploads, desktop-only toolchains, or code execution inside Android;
- activate Premium billing;
- add a new scanner OCR subsystem or full content index as part of the first Build 55 merge;
- merge draft MyAI/Lola PRs wholesale into this branch.

Scanner V2, local full-content indexing, and MyAI/Lola command-workbench integration may build on this shell later, but they are intentionally separated from the first Build 55 UI consolidation so UI stabilization remains testable and reversible.

## 4. Architectural decision

Approach B is selected: **shell consolidation plus usability redesign while preserving working engines**.

The application will have one presentation controller:

```text
MSAAppShell
  ├─ top bar / page header
  ├─ primary navigation
  ├─ Create Action Hub
  ├─ Search / Command Center
  ├─ contextual action sheets
  └─ page registration
        ├─ Home
        ├─ Files
        ├─ My Day / Planner
        ├─ AI
        ├─ Tools
        ├─ Templates / Library
        ├─ Me / Settings
        └─ Create Studio launcher
```

`MSAAppShell` owns page navigation state. Feature modules render content and expose actions but do not directly mutate competing navigation bars.

The Office editor remains a full-screen specialized shell because it is a task environment rather than a normal app destination. It returns to the central shell through one documented close/back contract.

## 5. Primary navigation

### Phone navigation

Default five-slot bottom navigation:

1. Home
2. Files
3. Create (`+`)
4. My Day
5. AI

`Tools` moves out of the permanent bottom bar because it is reachable from Home, global search, drawer, and command center. This reduces permanent navigation competition while giving Planner/My Day a first-class destination.

The fourth slot is configurable through Settings with allowed values:

- My Day (default)
- Tools
- Library

Only these three values are supported. Navigation configuration is local and persisted using existing storage/mirroring conventions.

### Tablet / wide layout

At the existing wide-layout breakpoint, bottom navigation becomes a vertical navigation rail. The destination model remains identical; only presentation changes. Feature modules must not care whether the navigation is bottom or rail.

### Navigation contract

All normal pages open through `MSAAppShell.open(pageId)`.

Modules such as Planner and Library must stop adding their own navigation controls to `.nav`.

Legacy `.nav` may remain temporarily in `index.html` during migration but must not be mutated by active Build 55 feature modules. Once all destinations are verified on the consolidated shell, dormant legacy navigation markup can be removed in a later cleanup commit.

## 6. Page header model

Build 55 introduces two header modes.

### Root pages

Home uses:

- menu / drawer button;
- global search button or field;
- profile/avatar action.

### Secondary pages

Files, My Day, Tools, Library, Settings, and related subpages use:

- Back or destination context on the left;
- page title in the center/content area;
- contextual search or overflow action on the right when applicable.

The current `topbarHTML(title)` helper must actually render the supplied page title instead of accepting and ignoring it.

Large page headings may remain inside page content, but scrolling should preserve orientation through the sticky compact header.

## 7. Create Action Hub

The center Create control becomes a multifunction action hub instead of always routing through the full Create page.

Single tap opens a bottom action sheet with:

- Document
- Spreadsheet
- Presentation
- PDF
- Smart HTML
- Scan / Camera input
- Open / Import File
- Import Folder
- Create with AI
- Template Center

Recent create actions may appear below the primary actions when reliable local history is available.

The full Create page remains available as an expanded destination and continues to show templates/import workflows. The action hub is the fast path; the page is the browse path.

Critical actions must remain visible in the sheet; no critical operation may exist only behind long press or a gesture.

## 8. Global Search / Command Center

The existing `search-center.js` becomes the base for Search Center V2.

Build 55 scope includes searching and launching:

- projects/files by title and metadata already available locally;
- tools;
- templates;
- AI assistants/modes;
- planner entries by title/note metadata when available;
- direct application commands such as New Document, Scan, Import, Backup, Settings, and Open My Day.

Search filters:

- All
- Files
- Tools
- Templates
- AI
- Calendar
- Actions

Full document-content indexing is explicitly out of scope for the first Build 55 merge. The architecture should allow a future local content provider to add results without changing the Search Center UI contract.

Search results use one normalized result model:

```text
{
  id,
  kind,
  icon,
  title,
  subtitle,
  score,
  action
}
```

Providers contribute results; Search Center owns ranking and rendering.

## 9. Button and interaction system

Build 55 standardizes interactive geometry.

Minimum interactive target: **48 × 48 CSS px equivalent** for phone controls.

Standards:

- icon-only controls: at least 48 × 48 hit area;
- compact chips: target 48 px height or equivalent padded hit region;
- standard action buttons: 48–52 px minimum height;
- primary buttons: 52–56 px target height;
- list rows: 60–72 px minimum height;
- bottom navigation destinations: at least 56 px effective touch height;
- destructive controls use explicit red/danger semantics and confirmation/undo according to existing action risk.

Icons may remain visually 20–24 px within larger hit areas.

`mobile-quality.js` must use 48 as the Build 55 touch-target minimum and must report actual undersized controls.

Icon-only buttons must have accessible names (`aria-label` or equivalent text).

## 10. Visual system

Build 55 retains the dark local-first visual identity but removes unnecessary inconsistency.

### Tokens

One token layer defines:

- background;
- surface 1 / surface 2;
- border;
- primary text;
- secondary text;
- accent;
- semantic success;
- semantic AI;
- semantic warning/limited;
- semantic danger;
- focus ring;
- spacing scale;
- corner-radius scale;
- touch-size scale.

Existing modules may consume compatibility variables during migration.

### Icons

New primary navigation and high-frequency actions should use a local SVG icon set with a consistent stroke/size language. Emoji may remain in user content, templates, or secondary illustrative contexts but should not be the long-term primary control icon system.

No remote font/icon dependency is required.

### Density

Home and AI screens should reduce vertical repetition. High-frequency tasks appear first; discovery content moves behind Search, Tools, Templates, or secondary sections.

## 11. Home redesign

Build 55 Home order:

1. Search / Ask MSA One entry
2. Continue Working
3. My Day summary
4. Quick Actions
5. Recommended / For You (tools/templates as space permits)

The current separate large sections for Quick Create, Smart Tools, Template Spotlight, and AI Assistants should be reduced so the user is not forced through a long dashboard to reach core work.

Home quick actions should focus on high-frequency tasks only:

- New Document
- Scan
- Import
- Ask AI

Additional formats remain available through the Create Action Hub.

## 12. Files redesign

Files keeps the existing strong project action-sheet concept.

### Filter behavior

Only filters with real behavior are presented as active categories.

If Image and Other filtering is implemented against real project types/descriptors, they remain. Otherwise they are removed from the visible filter strip until supported. No visible filter may silently reset to All.

### Row behavior

- Tap file row → Open
- Overflow → Action sheet
- Optional long press → Selection mode, but every selection operation also has a visible path

Action sheet target set:

- Open
- Ask AI
- Rename
- Duplicate
- Convert (only when real conversion options are available)
- Export / Save Copy
- Properties
- Delete

Move/Pin/Share are not required for the first Build 55 merge unless the underlying action already exists safely.

### Storage section

Device, Downloads, Connected Folder, and Re-scan remain but should use consistent row patterns and truthful descriptions.

## 13. Tools truth-state model

Every tool card gains a capability state from this finite set:

- Available
- Limited
- Planned
- Requires file
- Desktop companion

A tool displayed as Available must have an implemented action path.

Specific Build 55 corrections:

- `File Compressor`: Planned unless a real compression engine is added separately.
- `OCR Reader`: renamed to a truthful scanned-document/AI-assist label or marked Limited because built-in OCR is not currently available.
- `Manage PDF Pages` / `Extract Pages`: labels must match what the current PDF engine actually supports.
- generic fallback messages such as “prepared in Tools Center” must not be used for cards styled as fully functional features.

The tool catalog becomes the source of truth for both capability state and action routing.

## 14. Drawer redesign

The drawer becomes secondary navigation and utility access, not a parallel product map.

Recommended groups:

### Workspace
- Scanner / Camera
- Tools
- Templates
- Library
- My Day

### Device & App
- Storage & Backup
- Settings
- Update Status
- Security Status

### Support
- Help & Feedback
- Profile

Entries whose existing implementation does not match the label must be renamed or removed.

Examples:

- QR / Import is removed unless a real QR workflow exists.
- Plug-in / Library Management is renamed Library if it only opens Library.
- Update Center must display actual update status/policy rather than simply opening Premium.
- Security Center may be called Security Status if it primarily displays diagnostics.

## 15. AI page redesign

Build 55 keeps the existing local-first AI engine and file attachment behavior.

The page is simplified into:

- primary composer;
- File / Camera / Voice attachments;
- mode chips: General, Document, Technical, Coding;
- recent or suggested tasks below the composer.

Assistant catalog items may map into modes or secondary presets rather than occupying many repeated full-width rows.

Actions that are not implemented, such as Add Your Assistant, must not appear as primary active actions. They may be labeled Planned in a secondary area or omitted.

AI status should remain explicit about local/offline versus connected/model-assisted behavior.

## 16. Office editor improvements

The existing Office mobile shell is preserved.

Build 55 changes are limited to interaction consistency:

- make all ribbon controls meet the 48 px touch contract;
- reduce redundant controls visible simultaneously on narrow screens;
- keep high-frequency contextual actions in the ribbon;
- move less frequent actions into the existing More Options sheet;
- maintain drag-down dismissal without conflicting with document scrolling or global swipe navigation;
- preserve safe-area handling and current native PDF path;
- ensure editor close/back returns through the central shell predictably.

No document data-model rewrite is part of this UI project.

## 17. Planner / My Day integration

Planner data remains in the existing `msaOnePlannerV1` model for Build 55.

The Planner becomes a normal `MSAAppShell` destination and stops mutating legacy navigation.

Home displays a compact My Day summary derived from existing planner entries:

- number of entries today;
- next timed entry when present;
- direct Open My Day action.

Planner editor continues using a bottom-sheet model but must adopt shared touch, spacing, header, and safe-area tokens.

## 18. Action registry

`action-registry.js` expands from a partial list into the contract for user-visible primary actions.

Each entry records:

- stable action id;
- user-visible label;
- surface/area;
- selector or registration hook;
- implementation target;
- capability state;
- destructive flag;
- minimum touch target requirement when applicable.

Automated tests verify:

- every registered Available action resolves to an implementation;
- no visible primary action is missing from the registry;
- Planned/Limited actions cannot masquerade as Available;
- destructive actions are identified;
- key action labels match their routed behavior.

## 19. Data flow

Build 55 does not introduce a second application state store.

```text
User input
   ↓
MSAAppShell / Action Hub / Search Center
   ↓
registered feature action
   ↓
existing engine
   ├─ MSAProjects
   ├─ MSAFiles
   ├─ MSAStudio
   ├─ MSAPlanner
   ├─ MSAAIEngine
   ├─ MSAStorage
   └─ Native bridge
   ↓
result/status
   ↓
shared feedback UI + refreshed owning page
```

Presentation state such as selected nav destination, action-sheet state, and search query remains transient unless a specific preference such as fourth-tab choice requires persistence.

Existing project/document data formats must not change merely to support the new shell.

## 20. Error handling and feedback

Use the existing helper/toast infrastructure where possible, with these rules:

- errors must describe what failed, not only say “unavailable”;
- unsupported/planned capability should be shown before the user begins destructive or expensive work;
- long-running operations use the existing performance/busy UI where available;
- destructive actions use confirmation or an immediate undo path consistent with existing storage behavior;
- button presses must not fail silently;
- navigation must recover to a valid root destination if a requested page/module is unavailable;
- malformed local preferences fall back to defaults without blocking startup.

## 21. Accessibility

Build 55 requires:

- 48 px minimum interactive target contract;
- accessible names for icon-only controls;
- visible focus treatment for keyboard/external-keyboard users;
- no critical gesture-only action;
- semantic live status region for important asynchronous status where practical;
- text truncation that retains full information through accessible names/title/detail views;
- sufficient contrast using shared tokens;
- portrait and landscape layouts that do not hide required actions behind unreachable regions.

`mobile-quality.js` will be updated to report these contracts rather than the older 44 px rule.

## 22. Android back behavior

Back behavior follows a strict stack:

1. close active modal/action sheet/search/drawer;
2. close secondary overlay/editor panel;
3. close full-screen Create Studio to its origin destination;
4. navigate secondary page to its parent/root destination;
5. at Home, defer to normal Android application back behavior.

Modules must not independently install conflicting back handlers when the shell can own the route/overlay stack.

## 23. Testing strategy

Build 55 is complete only after static and runtime-contract regression coverage is updated.

Required automated coverage:

### Shell
- five primary destinations render;
- configured fourth tab resolves only to allowed destinations;
- Planner does not mutate legacy `.nav`;
- current destination correctly highlights;
- missing optional page fails safely.

### Action Hub
- each primary Create action routes to the expected implementation;
- file/folder/template/AI paths remain distinct;
- no action silently aliases Convert to Open File when labeled conversion.

### Buttons / accessibility
- shared target constants are at least 48;
- mobile-quality threshold is 48;
- key icon-only controls provide accessible labels;
- active tool cards have real action mappings.

### Files
- visible filters produce matching behavior;
- overflow actions route correctly;
- delete remains destructive;
- unsupported categories are not presented as active filters.

### Tools
- every Available tool resolves;
- Limited/Planned state is explicit;
- compressor/OCR state is truthful.

### Search
- Files, Tools, Templates, AI, Calendar, Actions providers return normalized results;
- filters restrict results correctly;
- result action launches the expected target.

### Planner
- opens through AppShell;
- Home summary derives from existing local entries;
- add/edit/delete/undo behavior remains compatible.

### Office
- existing Office tests remain green;
- touch/ribbon contracts are preserved;
- safe-area and More Options regression tests remain green.

### Build
- `npm test` passes;
- syntax checks pass;
- Android lint passes;
- asset/package verification passes;
- debug APK assembles successfully before merge.

## 24. Runtime verification matrix

The branch must be behavior-checked for:

- compact Android phone portrait;
- compact Android phone landscape;
- large phone portrait;
- tablet / wide layout;
- status-bar and navigation-bar safe areas;
- keyboard open/closed around Search and AI composer;
- long file names;
- empty workspace;
- populated workspace;
- planner with no entries and many entries;
- modal/action-sheet dismissal;
- Android back behavior;
- Files → Open → Editor → Back path;
- Home → Create Hub → Editor path;
- Search → result → destination path.

Automated CSS/source checks are supporting evidence, not substitutes for runtime behavior verification.

## 25. Migration sequence

Implementation should proceed in dependency order:

1. introduce Build 55 UI tokens and 48 px interaction contract;
2. consolidate `MSAAppShell` navigation and page registration;
3. integrate Planner/My Day into AppShell and stop legacy-nav mutation;
4. implement Create Action Hub;
5. upgrade Search Center to normalized multi-provider command search;
6. repair Files filters/action truthfulness;
7. add tool capability states and drawer truth-state cleanup;
8. simplify Home and AI presentation;
9. normalize Office ribbon touch/density without changing document engines;
10. expand action registry and mobile diagnostics;
11. run full source, regression, Android lint, package, and APK verification.

Each step must leave existing project data readable and allow the branch to be reverted without data migration.

## 26. Definition of done

Build 55 UI consolidation is GREEN only when all of the following are true:

- one active app navigation system controls normal pages;
- Planner no longer depends on the hidden legacy `.nav`;
- zero visible primary buttons intentionally do nothing;
- zero Available tools route to generic “prepared” placeholders;
- visible filter controls perform the behavior they claim;
- all primary interactive targets meet the 48 px contract or expose an equivalent hit area;
- no critical action requires an undiscoverable gesture;
- Home, Files, Create Hub, My Day, AI, Tools, Library, and Me/Settings use the same shell language;
- Office editor remains compatible with existing data and import/export paths;
- action registry and diagnostics reflect actual runtime contracts;
- portrait/landscape and wide-layout behavior are verified;
- Android safe areas and back handling are verified;
- existing storage/recovery and Office regression suites remain green;
- Android lint passes;
- APK asset verification passes;
- debug APK builds successfully.

## 27. Deferred follow-on work

After Build 55 shell stabilization, separate design/implementation cycles may address:

- Scanner V2 with crop/rotate/multipage/PDF pipeline;
- local OCR engine selection and packaging;
- local full-content search/indexing;
- richer Files selection, pin/favorite/move/share workflows;
- MyAI/Lola command-workbench integration;
- release signing/AAB distribution pipeline;
- broader visual polish and motion after functional consistency is proven.

These are intentionally not prerequisites for merging the first Build 55 UI consolidation.
