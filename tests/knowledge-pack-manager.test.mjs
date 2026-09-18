import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/knowledge-pack-manager.js';assert.ok(fs.existsSync(p),'missing Knowledge Pack Manager '+p);const s=fs.readFileSync(p,'utf8');
for(const k of ['MSAKnowledgePackManager','importPack','validatePack','stagePack','activatePack','rollbackPack','updatePack','removePack','compatibilityCheck'])assert.ok(s.includes(k),'missing Knowledge Pack Manager '+k);
for(const k of ['provenance','version','sourceId','status','staged','active','history'])assert.ok(s.includes(k),'missing Knowledge Pack metadata '+k);
for(const k of ['MSAAnwarLens','MSAAgentRouter','sahab','anwar','loadKnowledge'])assert.ok(s.includes(k),'missing Knowledge Pack integration '+k);
for(const k of ['AVAILABLE','REJECTED','INCOMPATIBLE','APPROVED'])assert.ok(s.includes(k),'missing Knowledge Pack capability/approval state '+k);
assert.ok(s.includes('rollback'),'Knowledge Pack Manager must be reversible');
console.log('Knowledge Pack Manager contract passed');