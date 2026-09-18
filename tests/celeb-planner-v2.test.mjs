import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/celeb-planner.js';assert.ok(fs.existsSync(p),'missing Celeb Planner '+p);const s=fs.readFileSync(p,'utf8');
for(const k of ['MSACelebPlanner','createPlan','updatePlan','planMemory','daily','weekly','monthly','agenda','recurring','followUp','finalReport'])assert.ok(s.includes(k),'missing Celeb Planner v2 '+k);
for(const k of ['goal','inputs','assumptions','tasks','schedule','resources','outputs','results','changes'])assert.ok(s.includes(k),'missing Celeb Plan Memory '+k);
for(const k of ['MSAProjectStore','MSAKagaLibrary','MSARagaConverter','MSAAgentRouter','celeb'])assert.ok(s.includes(k),'missing Celeb integration '+k);
for(const k of ['persist','restore','version','created','updated'])assert.ok(s.includes(k),'missing Celeb persistence '+k);
console.log('Celeb Planner v2 contract passed');