import fs from 'node:fs';import assert from 'node:assert/strict';
const source='scripts/agent-sahab-source-audit.mjs', verdict='scripts/agent-sahab-verdict.mjs';
assert.ok(fs.existsSync(source),'Agent Sahab source bot is missing');
assert.ok(fs.existsSync(verdict),'Agent Sahab final verdict bot is missing');
const s=fs.readFileSync(source,'utf8');
for(const x of ['Agent Sahab','FREE_FIRST','BLOCKER','HIGH','MEDIUM','LOW','PREMIUM/LATER','agent-sahab-source.json'])assert.ok(s.includes(x),'source bot missing '+x);
const v=fs.readFileSync(verdict,'utf8');
for(const x of ['APPROVED','CHANGES REQUIRED','agent-sahab-verdict.json','agent-sahab-verdict.md'])assert.ok(v.includes(x),'verdict bot missing '+x);
console.log('Agent Sahab bot contract passed');