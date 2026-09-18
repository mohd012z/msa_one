import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/runtime-integration-v2.js';assert.ok(fs.existsSync(p),'missing Runtime Integration v2 '+p);const s=fs.readFileSync(p,'utf8');
for(const k of ['MSARuntimeIntegration','boot','route','openFiles','openCreate','openAI','openMe','openProject','importToWorkspace','handoff','healthCheck'])assert.ok(s.includes(k),'missing runtime integration '+k);
for(const k of ['MSAFilesWorkspace','MSAStudio','MSASmartHTML','MSARagaConverter','MSAAnwarLens','MSACelebPlanner','MSAKagaLibrary','MSAAgentRouter'])assert.ok(s.includes(k),'missing runtime module '+k);
for(const k of ['home','files','create','ai','me','msa:runtime-ready','msa:runtime-error'])assert.ok(s.includes(k),'missing runtime route/event '+k);
for(const k of ['AVAILABLE','DEGRADED','UNAVAILABLE','capabilities','errors'])assert.ok(s.includes(k),'missing runtime health state '+k);
assert.ok(!s.includes('eval('),'runtime must not use eval');
console.log('Runtime Integration v2 contract passed');