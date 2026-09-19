import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('www/index.html','utf8');
assert.ok(html.includes('action-registry.js'),'index must load action-registry.js');

const src=fs.readFileSync('www/action-registry.js','utf8');
const listMatch=src.match(/const REGISTRY=\[([\s\S]*?)\];/);
assert.ok(listMatch,'action-registry.js must define a REGISTRY list');

const entries=[...listMatch[1].matchAll(/\{name:'([^']+)',area:'([^']+)',selector:'([^']+)',impl:'([^']+)'\}/g)]
  .map(m=>({name:m[1],area:m[2],selector:m[3],impl:m[4]}));
assert.ok(entries.length>=15,'action registry should catalog a meaningful number of buttons, got '+entries.length);

const sourceCache={};
function readSource(file){return sourceCache[file]??=fs.readFileSync('www/'+file,'utf8')}

for(const entry of entries){
  // Every declared CSS selector attribute (data-*) must actually appear somewhere real, not be aspirational.
  const dataAttrs=[...entry.selector.matchAll(/data-[a-z-]+(?:="[^"]*")?/g)].map(m=>m[0]);
  for(const attr of dataAttrs){
    const attrName=attr.split('=')[0];
    const foundSomewhere=['create-studio.js','files-workspace.js','office-mobile.js','app-actions.js']
      .some(file=>readSource(file).includes(attrName));
    assert.ok(foundSomewhere,'registry entry "'+entry.name+'" references '+attrName+' which does not appear in any known UI source file');
  }
  // Every non-inline implementation must be a real, exported function.
  if(!entry.impl.includes('+')&&entry.impl.includes('.')){
    const [obj,member]=entry.impl.split('.');
    const exportedSomewhere=['create-studio.js','files-workspace.js','storage-engine.js','ai-reader.js']
      .some(file=>{
        const s=readSource(file);
        return (s.includes('window.'+obj+'=')||s.includes('globalThis.'+obj+'='))&&s.includes(member);
      });
    assert.ok(exportedSomewhere||entry.impl.startsWith('office-mobile.js'),'registry entry "'+entry.name+'" claims implementation '+entry.impl+' but no source file exports it');
  }
}

// The registry must expose a live audit() so it can be checked at runtime, not just documented.
assert.ok(src.includes('function audit()'),'action registry must be able to self-audit at runtime');
assert.ok(src.includes('globalThis.MSAActionRegistry'),'action registry must be reachable from the app');

console.log('action-registry (button name -> real implementation) contract passed, '+entries.length+' actions catalogued');
