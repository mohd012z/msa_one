# MSA One / MSA Patcher companion contract

MSA One acts as the user's **MSA Patcher** app. The Android app is local-first and only exchanges manual handoff files with:

- `mohd012z/in_ai`
- `mohd012z/lola`

## Safety rules

- Export only user-selected metadata and text.
- Do not auto-upload files from MSA One.
- Do not scan the device.
- Do not expose secrets.
- Do not call undocumented services.
- Analyze only authorized projects.
- Lola execution is **desktop-only**; MSA One does not run Lola tooling on-device.

## Handoff manifest

Exported manifest kinds:

- `msa-one-companion-handoff`

Current schema:

```json
{
  "schemaVersion": 1,
  "kind": "msa-one-companion-handoff",
  "createdAt": "2026-09-24T00:00:00.000Z",
  "app": {
    "name": "MSA One",
    "role": "MSA Patcher",
    "buildId": "MSA-ONE-54",
    "version": "54.0.0"
  },
  "targets": ["in_ai", "lola"],
  "taskKind": "coding",
  "title": "MSA Patcher handoff",
  "request": {
    "summary": "User-selected summary only",
    "selectedText": "User-selected text only",
    "questions": [],
    "constraints": []
  },
  "selectedMetadata": {
    "project": {
      "title": "Optional",
      "type": "Optional",
      "updated": 0,
      "id": "Optional"
    }
  },
  "transferRules": [
    "Only transfer this manifest and any separately user-authorized files.",
    "Do not scan the device, auto-upload files, expose secrets, or call undocumented services.",
    "Analyze only projects you are authorized to inspect."
  ],
  "destinations": {
    "in_ai": true,
    "lola": true
  }
}
```

Supported `taskKind` values:

- `coding`
- `office`
- `apk-creator`
- `development`
- `deep-dive`

## Result import contract

Imported result kinds:

- `msa-one-companion-result`

Current schema:

```json
{
  "schemaVersion": 1,
  "kind": "msa-one-companion-result",
  "createdAt": "2026-09-24T00:00:00.000Z",
  "source": "in_ai",
  "operationMode": "model-assisted",
  "taskKind": "coding",
  "title": "Companion result",
  "summary": "Bounded plain-text summary",
  "projectHint": "optional-project-id",
  "warnings": ["Optional warning"],
  "nextSteps": ["Optional next step"],
  "sections": [
    {"label": "Plan", "type": "text", "text": "Plain text only"},
    {"label": "Checklist", "type": "list", "items": ["Step 1", "Step 2"]},
    {"label": "Structured", "type": "json", "data": {"status": "ok"}}
  ]
}
```

Allowed `source` values:

- `in_ai`
- `lola`

Allowed `operationMode` values:

- `local-template`
- `model-assisted`
- `desktop-lola`

## Rendering and persistence

- MSA One imports companion results into an existing **document / Smart HTML** project or the local **MSA Patcher Companion Evidence** area.
- Imported content is rendered as escaped text and structured data only.
- Untrusted HTML is not injected.
- Companion state is persisted locally through `msaCompanionStateV1` and included in normal storage recovery / backup flows.
