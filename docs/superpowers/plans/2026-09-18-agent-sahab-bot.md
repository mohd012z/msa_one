# Agent Sahab Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Agent Sahab into a permanent free-first automated MSA One code/APK reviewer that emits an evidence-based APPROVED or CHANGES REQUIRED verdict before an APK is published.

**Architecture:** Keep Agent Sahab inside GitHub Actions and repository scripts so it costs nothing beyond available GitHub Actions allowances. Split source inspection, Android lint/build, APK inspection, and final verdict into explicit gates. The bot report records blocking failures separately from recommendations and never claims capabilities it did not test.

**Tech Stack:** GitHub Actions, Bash, Node.js contract tests, Gradle Android lint/build, Android SDK aapt, Capacitor.

**Spec:** GitHub Issue #2 — Agent Sahab master audit and Free-First directive.

## Global Constraints

- Free-first: no paid API, SDK, cloud service, subscription, or premium infrastructure required for the core APK.
- Preserve Build 37 adaptive display behavior.
- A failed blocking check must prevent audited APK publication.
- APPROVED requires source contracts, Android lint, APK build, APK integrity/assets/metadata checks to pass.
- Recommendations that are not blocking must be labelled INFO/IDEA or PREMIUM/LATER.
- Never fabricate a human review or AI judgment; the verdict describes automated checks actually executed.
- Keep `com.msa.one.displayfit37` until a deliberate stable-ID migration is designed so existing test installs remain upgrade-compatible.

---

### Task 1: Agent Sahab source bot contract

- [ ] Add a failing Node test for required Agent Sahab verdict/report fields and free-first policy markers.
- [ ] Run source audit and confirm RED.
- [ ] Create focused `scripts/agent-sahab-source-audit.mjs` that scans required source modules/contracts and writes machine-readable findings.
- [ ] Run test and confirm GREEN.
- [ ] Commit.

### Task 2: Harden APK inspector

- [ ] Add failing contract test that requires deterministic `aapt` selection and APK metadata checks.
- [ ] Confirm RED.
- [ ] Update `scripts/agent-sahab-audit.sh` to prefer `aapt`, validate ZIP/APK/assets/package/version, SHA-256, and emit severity-tagged findings.
- [ ] Confirm GREEN.
- [ ] Commit.

### Task 3: Final verdict gate

- [ ] Add failing test for `APPROVED` / `CHANGES REQUIRED` verdict semantics.
- [ ] Confirm RED.
- [ ] Add `scripts/agent-sahab-verdict.mjs` that combines source, lint/build, and APK evidence into `agent-sahab-verdict.md` plus JSON.
- [ ] Confirm GREEN.
- [ ] Commit.

### Task 4: GitHub Actions integration

- [ ] Update workflow so Agent Sahab source bot runs before Android packaging.
- [ ] Keep Gradle `lintDebug` as a blocking gate.
- [ ] Build debug APK only after source/lint checks pass.
- [ ] Run hardened APK inspector and final verdict.
- [ ] Upload report/verdict artifacts even on failure where possible.
- [ ] Publish APK artifact only when final verdict is APPROVED.
- [ ] Verify workflow syntax and commit.

### Task 5: Remove stale test bypass

- [ ] Repair `tests/calendar-visibility.test.mjs` to match current Calendar contract.
- [ ] Remove the workflow exception that skips this test.
- [ ] Run every source contract in `tests/*.test.mjs`.
- [ ] Commit.

### Task 6: Audit cycle and continuation gate

- [ ] Trigger branch CI.
- [ ] Inspect every failed Agent Sahab finding rather than suppressing it.
- [ ] Correct code and add regression tests for real defects.
- [ ] Repeat until source audit, Android lint, APK build, APK inspector and final verdict pass.
- [ ] Verify audited APK artifact and SHA-256 exist.
- [ ] Add concrete audit result to Issue #2.
- [ ] Only then continue the next MSA One feature task through the same Agent Sahab gate.
