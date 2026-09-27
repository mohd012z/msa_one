import fs from 'node:fs';
import assert from 'node:assert/strict';

const catalog=fs.readFileSync('www/template-catalog.js','utf8');
const center=fs.readFileSync('www/template-center.js','utf8');

const presentationIds=[...catalog.matchAll(/id:'(starter-[a-z-]+)',type:'presentation'/g)].map(m=>m[1]);
assert.ok(presentationIds.length>=6,'presentation template catalog should offer a real choice (6+), not just one deck');
assert.ok(presentationIds.includes('starter-training'),'existing Training Deck template must be preserved');

for(const id of presentationIds){
  assert.ok(center.includes("'"+id+"':["),'template-center must define a distinct starter slide deck for '+id);
}

// each deck should be multi-slide, not a single placeholder slide
for(const id of presentationIds){
  const line=center.split('\n').find(l=>l.trim().startsWith("'"+id+"':"));
  assert.ok(line,'deck for '+id+' must be on its own line in PRESENTATION_DECKS');
  const slideCount=(line.match(/\{title:/g)||[]).length;
  assert.ok(slideCount>=4,'presentation template '+id+' should have a real multi-slide outline (4+), got '+slideCount);
}

console.log('presentation template catalog contract passed');
