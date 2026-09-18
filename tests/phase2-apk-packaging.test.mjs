import fs from 'node:fs';import assert from 'node:assert/strict';
const p='.github/workflows/build-apk.yml',s=fs.readFileSync(p,'utf8');
const mods=['runtime-integration-v2.js','file-import-center-v2.js','document-production-engine-v2.js','spreadsheet-production-engine-v2.js','presentation-production-engine-v2.js','pdf-intelligence-workspace-v2.js','kaga-template-library-v2.js','raga-conversion-matrix-v2.js'];
for(const m of mods)assert.ok(s.includes(m),'Phase 2 module not packaged: '+m);
for(const k of ['MSARuntimeIntegration','MSAFileImportCenter','MSADocumentProductionEngine','MSASpreadsheetProductionEngine','MSAPresentationProductionEngine','MSAPDFIntelligenceWorkspace','MSAKagaTemplateLibrary','MSARagaConversionMatrix'])assert.ok((s.match(new RegExp(k,'g'))||[]).length>=2,'Phase 2 runtime marker not verified in web + Android: '+k);
console.log('Phase 2 APK packaging contract passed');