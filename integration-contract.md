# MSA One Release 1 integration contract

This contract defines the **manual local** handoff between **MSA One / MSA Patcher**, **MyAI**, and **desktop Lola**.

## Trust model

- MSA One only exports local **JSON** and **Markdown** files.
- MSA One never uploads local files automatically.
- Desktop Lola is **desktop-only** and does not run inside Android.
- Import only trusted result JSON from a project you own or are explicitly authorized to analyze.
- The app rejects malformed, oversized, duplicate, or path-like result payloads.

## Limits

- `contractVersion` must be `1.0`.
- Requests are bounded to local Release 1 limits.
- `selectedFiles` includes **metadata only**. No automatic file contents or uploads are included.
- Result imports are bounded by app-defined size and count limits for sections, findings, artifacts, and warnings.

## Manual workflow

1. In MSA One, open **MyAI ↔ Lola companion** from the AI workspace, Tools, or a File action.
2. Select the existing local project, task type, workflow, and request.
3. Confirm that the project is user-owned or explicitly authorized.
4. Export the handoff as local JSON or Markdown.
5. Move the exported file manually to MyAI or desktop Lola.
6. Import the trusted Release 1 result JSON back into the same MSA One local project.

## Job manifest schema

```json
{
  "contractVersion": "1.0",
  "jobId": "job_abc123",
  "source": "msa-one",
  "target": "myai",
  "taskType": "coding",
  "request": "Review this local project and propose the next safe steps.",
  "project": {
    "id": "p_local_01",
    "name": "Workspace report",
    "type": "document",
    "updatedAt": "2026-09-24T04:00:00.000Z",
    "companionImports": 0
  },
  "selectedFiles": [
    {
      "projectId": "p_local_01",
      "name": "Workspace report",
      "type": "document",
      "sizeBytes": 1204
    }
  ],
  "options": {
    "workflow": "model-assisted",
    "offline": true,
    "manualHandoff": true,
    "workflowLabel": "Model-assisted"
  },
  "authorization": {
    "confirmed": true,
    "scope": "user-owned-or-authorized-project"
  },
  "createdAt": "2026-09-24T04:00:00.000Z"
}
```

Required manifest fields are exactly:

- `contractVersion`
- `jobId`
- `source`
- `target`
- `taskType`
- `request`
- `project` metadata
- `selectedFiles` metadata only
- `options`
- `authorization`
- `createdAt`

## Result schema

```json
{
  "contractVersion": "1.0",
  "jobId": "job_abc123",
  "status": "completed",
  "provider": "myai",
  "summary": "Safe local summary of the work completed.",
  "sections": [
    {
      "title": "Plan",
      "format": "markdown",
      "content": "- Step 1\n- Step 2"
    }
  ],
  "findings": [
    {
      "title": "Offline validation",
      "severity": "info",
      "details": "No automatic upload occurred."
    }
  ],
  "artifacts": [
    {
      "label": "Checklist",
      "type": "text",
      "value": "Manual next steps",
      "digest": "sha256:demo",
      "sizeBytes": 42
    }
  ],
  "warnings": [
    "Desktop Lola must be run manually on an authorized machine."
  ],
  "provenance": {
    "tool": "myai",
    "toolVersion": "1.0",
    "createdAt": "2026-09-24T04:01:00.000Z"
  },
  "createdAt": "2026-09-24T04:01:00.000Z"
}
```

Required result fields are exactly:

- `status`
- `provider`
- `summary`
- `sections`
- `findings`
- `artifacts`
- `warnings`
- `provenance`
- `createdAt`

## Release 1 scope

Integrated now:

- bounded manifest creation and validation
- local JSON and Markdown export
- trusted local result import into an existing MSA project evidence area
- provenance, warnings, artifacts, provider, status, and timestamp persistence
- safe text/structured rendering only

Desktop-only or planned:

- desktop Lola execution itself
- any desktop analyzers or external toolchains
- any future non-local or cloud handoff options
- any claim that Android directly runs Lola, Python, PowerShell, apktool, Frida, or Semgrep
