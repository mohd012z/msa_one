# MSA One

MSA One is an all-in-one mobile office workspace prototype for documents, Smart HTML, local drafts, planning, file handling and assisted workflows.

## Current build — MSA One 38

MSA One 38 keeps the Android application ID `com.msa.one.displayfit37` so Build 38 can update the existing Build 37 installation instead of appearing as a separate app.

### Working locally

- Responsive Home, Files, Create, AI, Calendar and Me pages
- Android display auto-fit and portrait/landscape guards
- Document editor with local autosave
- Smart HTML editor with sandbox preview and HTML export
- Local draft search, open, rename, duplicate and delete
- Calendar / Daily Planner with Daily Program, Plan, Diary and Note entries
- Button Studio appearance settings stored on-device
- File/image picker and supported-device voice input shortcuts
- Offline task routing from the AI workspace into the appropriate local workspace

### Still requires a production engine/backend

- Real AI model responses
- Native DOCX/XLSX/PPTX/PDF generation and conversion
- Cloud synchronization and multi-device storage
- Production speech/presenter services
- Signed Play Store / release AAB pipeline

Local data currently uses browser/WebView storage, so clearing app data or uninstalling the app can remove unsynchronized drafts.

## Android build

GitHub Actions builds the Android debug APK with Capacitor.

1. Open **Actions → Build MSA One APK**.
2. Run the workflow manually or push a relevant source change to `main`.
3. Open the successful run.
4. Download the artifact **MSA-One-38-APK**.

The workflow tests the source first, verifies the permanent Calendar and module assets, syncs the same `www` source into Capacitor, sets Android `versionCode 38`, builds the APK, and uploads it as an artifact.

## Development

- Node.js 22 or newer
- Java 21 for Android builds
- Capacitor 7.4.3 is pinned at the top level
- Run `npm test` before building
