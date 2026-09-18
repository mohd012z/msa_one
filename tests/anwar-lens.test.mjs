import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/anwar-lens.js';assert.ok(fs.existsSync(p),'missing Anwar Knowledge Agent '+p);const s=fs.readFileSync(p,'utf8');
for(const k of ['MSAAnwarLens','loadKnowledge','retrieve','answer','evidence','citations','handoff','providerAdapter'])assert.ok(s.includes(k),'missing Anwar foundation '+k);
for(const k of ['Answer','Explain','Teach','Write','Rewrite','Summarize','Document','Compare','Analyze','Brainstorm','Research','Troubleshoot','Step-by-Step'])assert.ok(s.includes(k),'missing Anwar mode '+k);
for(const k of ['MSAAgentRouter','MSAKagaLibrary','MSARagaConverter','MSACelebPlanner','anwar'])assert.ok(s.includes(k),'missing Anwar integration '+k);
for(const k of ['local','OPTIONAL','provenance','sourceId','version'])assert.ok(s.includes(k),'missing Anwar evidence/provider truth '+k);
assert.ok(!s.includes('eval('),'Anwar must not execute retrieved knowledge');
console.log('Anwar Multi-Thinker Knowledge Agent contract passed');