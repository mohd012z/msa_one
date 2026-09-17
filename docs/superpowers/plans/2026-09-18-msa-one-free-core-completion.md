# MSA One Free Core + Agent Team Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete a useful free/offline MSA One core with a controlled multi-agent architecture for Office-style creation, conversion, planning, knowledge assistance, local recovery and audited APK delivery.

**Architecture:** `MSAProjectStore` is the single local project graph. Kaga, Raga, Celeb and Anwar are named software roles with explicit capabilities, permissions and knowledge packs; they do not pretend to be independent humans. Agent Sahab is the verification gate and can block publication. Each agent calls shared deterministic tools instead of maintaining incompatible copies of document data.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, IndexedDB + recovery mirror, Capacitor Android, Node tests, Gradle lint/build, GitHub Actions, free/open-source libraries only after license/size/security/Android-offline validation.

## Global Constraints
- Free-first core; no paid API/cloud/subscription required.
- Preserve Build 37 adaptive display and `com.msa.one.displayfit37` until separate migration.
- Local/private by default; explicit import/export.
- No claim of DOCX/XLSX/PPTX/PDF fidelity until fixtures prove it.
- Every batch: RED → GREEN → Agent Sahab → Android lint/build/APK inspection.
- Agent knowledge is versioned, attributable and reversible; user documents are not silently promoted into global knowledge.

## Agent Control Plane

Each agent has a manifest: `id`, `name`, `role`, `allowedTools`, `deniedTools`, `knowledgePacks`, `capabilityVersion`, `confidence/evidence policy`, and audit events. `agent-router.js` routes requests; `agent-registry.js` enforces permissions. Agents return structured results and evidence, not arbitrary cross-agent mutation. Agent Sahab validates manifests, permissions and regression contracts.

### Kaga — Library Foundation / Office Creator
Purpose: create and improve open-source Office-style work, templates and reusable components.

- Document: reports, letters, manuals, SOP/OJT, proposals, forms, checklists, cover pages, headers/footers, TOC, tables, image blocks, page styles.
- Spreadsheet: workbook templates, tables, formulas supported by the local engine, charts, dashboards, schedules, registers.
- Presentation: themes, masters/layouts, title/content/chart/image/timeline slides, speaker-note structures.
- PDF/HTML: printable report layouts and reusable document blocks.
- Template intelligence: template metadata, required fields, sample data, recommended sections, device/page constraints, accessibility tags.
- Kaga never changes the underlying project without an explicit create/apply action and undo snapshot.

### Raga — Conversion & Report Agent
Purpose: convert between supported Office/open formats and MSA/HTML representations and build reports.

- Canonical intermediate representation: `MSA Document IR` for paragraphs, styles, tables, media references, sheets/cells, slides and metadata.
- Pipelines: HTML ↔ MSA Document; CSV ↔ Sheet; MSA Document → printable HTML/PDF path; later DOCX/XLSX/PPTX import/export only after a free library passes fixture tests.
- Produces a conversion report: imported, preserved, approximated, unsupported, warnings and loss-risk.
- Never silently drops unsupported content; preserves source file and reports fidelity limitations.

### Celeb — Planner Agent
Purpose: daily plan, calendar, diary, programs, tasks, notes and follow-up.

- Daily/weekly/monthly views, agenda, recurring plans, priorities, due dates, completion and notes.
- Local reminders are separate from external calendar synchronization.
- Can turn a plan into a Kaga document/template or Raga report without duplicating project state.
- Does not invent calendar events; distinguishes saved events, suggestions and drafts.

### Anwar — AI Lens / Knowledge Answer Agent
Purpose: answer user questions across MSA One using controlled local knowledge and optional future providers.

- Searches approved local knowledge packs, project metadata and explicitly selected user documents.
- Response pipeline: classify intent → retrieve evidence → answer → show source/evidence scope → offer action through Kaga/Raga/Celeb when relevant.
- Local deterministic help/search works without cloud AI. Optional model providers are adapters and remain Premium/Later unless genuinely free and configured.
- Must say when evidence is missing or a capability is unavailable; no fabricated document facts.

### Agent Sahab — Quality & Release Gate
Purpose: inspect the work of all agents and the packaged Android app.

- Validates tests, agent permissions, Free-First rules, storage/lifecycle, conversion fixtures, template schema, security boundaries, display fit, Android lint, packaged assets and APK integrity.
- `CHANGES REQUIRED` blocks APK publication. `APPROVED` only describes checks actually executed.

## Knowledge Improvement System

Create versioned knowledge packs under `www/knowledge/` with manifest, topic, version, source/provenance, updated date, trust tier and test cases. Built-in packs cover MSA help, editor capabilities, template rules, conversion rules and planner behavior. User documents stay project-scoped unless the user explicitly adds them to a local personal knowledge collection. Knowledge updates use staging → validation → Agent Sahab tests → activation; rollback keeps the previous pack. Anwar retrieval must prefer exact project evidence over generic guidance and must expose uncertainty. Kaga learns new templates by registering reviewed template definitions, not by silently rewriting its rules. Raga improves only when new conversion fixtures prove round-trip behavior. Celeb improves planner rules through tested scheduling/recurrence fixtures.

## Coding Tasks

### Task 1 — Storage & Recovery v2
- [ ] RED tests for corruption, backup recovery, restore validation, duplicate IDs and lifecycle flush.
- [ ] Deterministic IndexedDB/recovery reconciliation and last-known-good backup.
- [ ] Validate project/agent/knowledge schemas and bound unsafe fields.
- [ ] GREEN + Agent Sahab gate.

### Task 2 — Agent Registry & Router
- [ ] RED tests for Kaga/Raga/Celeb/Anwar manifests, permissions and denied cross-role operations.
- [ ] Create `www/agent-registry.js`, `www/agent-router.js`, `www/agent-audit.js`.
- [ ] Add capability/version/status UI and audit trail.
- [ ] GREEN + Agent Sahab gate.

### Task 3 — Kaga Library Foundation
- [ ] Create `www/kaga-library.js`, template schema/catalog and tests.
- [ ] Seed high-quality Document, Sheet and Presentation template families with sample content.
- [ ] Add preview, search/category, duplicate/customize, apply and undo snapshot.
- [ ] Responsive template rules for phone/tablet/desktop and print.
- [ ] GREEN + Agent Sahab gate.

### Task 4 — Universal MSA Document IR
- [ ] Define versioned IR for document blocks, sheets, slides, media refs and metadata.
- [ ] Add validators/migrations and round-trip tests.
- [ ] Connect Create Studio and ProjectStore without breaking existing projects.
- [ ] GREEN + Agent Sahab gate.

### Task 5 — Document Studio v2
- [ ] Pages, styles, headings, tables, images, reusable blocks, headers/footers, page numbers, TOC model, undo/redo.
- [ ] Kaga template application and safe local export.
- [ ] Mobile toolbar/keyboard/selection improvements.
- [ ] GREEN + Agent Sahab gate.

### Task 6 — Spreadsheet Studio v2
- [ ] Multi-sheet model, safe cells, formulas in supported subset, formatting, sort/filter, freeze, charts/dashboard blocks.
- [ ] CSV import/export and Kaga workbook templates.
- [ ] Formula/parser fixture tests; never use arbitrary JS evaluation.
- [ ] GREEN + Agent Sahab gate.

### Task 7 — Presentation Studio v2
- [ ] Slides, themes/layouts, reorder, notes, images/tables/charts, presentation mode and local HTML export.
- [ ] Kaga slide templates and reusable theme tokens.
- [ ] GREEN + Agent Sahab gate.

### Task 8 — Raga Conversion Engine
- [ ] Create `www/raga-converter.js`, adapters and conversion-report UI.
- [ ] HTML ↔ Document IR and CSV ↔ Sheet first.
- [ ] Evaluate free/open-source DOCX/XLSX/PPTX/PDF libraries by license, bundle size, offline Android support, fidelity and security before dependency adoption.
- [ ] Build golden fixture corpus and round-trip tests before advertising each format.
- [ ] Preserve unsupported source and show fidelity/loss report.
- [ ] GREEN + Agent Sahab gate.

### Task 9 — PDF Workspace
- [ ] Safe PDF workspace, metadata/notes/organization and printable report path supported by actual implementation.
- [ ] Raga PDF conversion capabilities remain capability-gated by fixtures.
- [ ] GREEN + Agent Sahab gate.

### Task 10 — Celeb Planner v2
- [ ] Repair stale Calendar test and remove workflow skip.
- [ ] Daily/weekly/monthly/agenda, recurring items, priorities, completion, diary/notes and follow-up.
- [ ] Planner → Kaga document and Planner → Raga report actions.
- [ ] GREEN all tests with no Calendar bypass + Agent Sahab gate.

### Task 11 — Anwar AI Lens Foundation
- [ ] Create `www/anwar-lens.js`, retrieval index, evidence model and knowledge-pack loader.
- [ ] Local help/Q&A over approved knowledge and explicitly selected project documents.
- [ ] Add source scope, confidence/evidence state, “not found” behavior and action handoff to other agents.
- [ ] Optional provider adapter interface without making cloud AI a core dependency.
- [ ] RED/GREEN retrieval tests including conflicting/stale/missing evidence + Agent Sahab gate.

### Task 12 — Knowledge Pack Manager
- [ ] Create versioned manifests, staging, validation, activation and rollback.
- [ ] Built-in capability/template/conversion/planner/help packs.
- [ ] Explicit opt-in for adding user material to personal local knowledge.
- [ ] Agent Sahab checks provenance fields, schema and regression questions before activation.

### Task 13 — Files Workspace v2
- [ ] Safe rendering, folders/tags, search, recent/starred, rename/duplicate/delete, backup import/export and version metadata.
- [ ] Cross-studio project navigation and agent-generated artifacts remain in one project graph.
- [ ] GREEN + Agent Sahab gate.

### Task 14 — Smart HTML v2
- [ ] Safe source editor/import/export and sandbox preview.
- [ ] Raga HTML conversion actions and Kaga web/report templates.
- [ ] No imported script executes in parent context.
- [ ] GREEN + Agent Sahab gate.

### Task 15 — Mobile, Accessibility & Security
- [ ] Responsive containment, focus, labels, touch targets, keyboard shortcuts and undo/redo.
- [ ] Audit imports, HTML injection, sandbox, agent permissions, external navigation and lifecycle recovery.
- [ ] GREEN + Agent Sahab gate.

### Task 16 — Full Agent Sahab Completion Audit
- [ ] Run every test with no skips.
- [ ] Source/agent/knowledge/conversion/template audits.
- [ ] Gradle `lintDebug` and Android build.
- [ ] APK manifest/assets/package/version/SHA-256 inspection.
- [ ] Upload evidence and publish APK only after final `APPROVED`.

## Capability Truth Model
Every feature is `AVAILABLE`, `PREVIEW`, `LATER`, or `UNAVAILABLE`. Kaga/Raga/Celeb/Anwar must query the registry rather than promise unsupported features. Office format fidelity is measured with fixtures; the UI displays conversion warnings. Agent Sahab verifies these capability labels against implementation.

## Definition of Complete
Free-core complete means Tasks 1–15 reach their truthful implemented scope, all tests run without bypass, knowledge and conversion fixtures pass, Agent Sahab returns APPROVED, Android lint/build and APK inspection pass, and an audited APK artifact exists. Optional cloud AI and proprietary/high-fidelity features remain separate adapters and do not block the free core.
