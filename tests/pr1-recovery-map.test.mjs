import fs from 'node:fs';import assert from 'node:assert/strict';
const doc=fs.readFileSync('docs/PR1_RECOVERY_MAP.md','utf8');
for(const item of ['project-store.js','smart-html-v2.js','file-import-center-v2.js','runtime-integration-v2.js','production-engine-v2','ui-action-controller-v2.js']) assert.ok(doc.includes(item),'recovery map must cover '+item);
assert.ok(doc.includes('built-in OCR: false'),'recovery map must explicitly preserve truthful OCR capability');
assert.ok(doc.includes('Do not merge'),'recovery map must distinguish stale PR1 modules');
console.log('PR1 recovery map contract passed');
