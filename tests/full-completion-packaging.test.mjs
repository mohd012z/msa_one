import fs from 'node:fs';import assert from 'node:assert/strict';
const wf=fs.readFileSync('.github/workflows/build-apk.yml','utf8');
const modules=['agent-registry.js','agent-router.js','kaga-library.js','document-ir.js','raga-converter.js','pdf-workspace.js','celeb-planner.js','anwar-lens.js','knowledge-pack-manager.js','mobile-accessibility-security.js','smart-html-v2.js'];
for(const m of modules)assert.ok(wf.includes("'www/"+m+"'")||wf.includes('"www/'+m+'"'),'workflow must package '+m);
assert.ok(!/calendar-visibility\.test\.mjs\)\s*continue/.test(wf),'calendar visibility test must not be skipped');
for(const marker of ['MSAAgentRegistry','MSAAgentRouter','MSAKagaLibrary','MSADocumentIR','MSARagaConverter','MSAPDFWorkspace','MSACelebPlanner','MSAAnwarLens','MSAKnowledgePackManager','MSAMobileAccessibilitySecurity','MSASmartHTML'])assert.ok(wf.includes(marker),'workflow must verify packaged runtime marker '+marker);
assert.ok(wf.includes('android/app/src/main/assets/public/index.html'),'must verify Android packaged asset');
console.log('Full Agent Sahab completion packaging contract passed');