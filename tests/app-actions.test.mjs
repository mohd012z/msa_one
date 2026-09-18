import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('www/index.html','utf8');
const js=fs.readFileSync('www/app-actions.js','utf8');

for(const asset of ['theme-v2.css','create-studio.css','files-workspace.css','planner.css','storage-engine.js','office-engine.js','formula-engine.js','settings-v2.js','create-studio.js','files-workspace.js','planner.js','app-actions.js']){
  assert.ok(html.includes(asset),'source HTML must load '+asset);
}
for(const action of ['reader','converter','automation','files','scan','image','voice','start','profile','ui-studio','backup','restore']){
  assert.ok(html.includes('data-msa-action="'+action+'"'),'missing wired action '+action);
}
for(const capability of ['MSAActions','SpeechRecognition',"type='file'",'MSAStudio','MSAPlanner','localStorage','MSAStorage']){
  assert.ok(js.includes(capability),'app action controller missing '+capability);
}
assert.ok(js.includes("accept='image/*'")||js.includes("openPicker('image/*'"),'image picker must accept images');

console.log('app action wiring contract passed');
