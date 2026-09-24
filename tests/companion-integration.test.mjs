import assert from 'node:assert/strict';

const data=new Map();
globalThis.localStorage={
  getItem:key=>data.has(key)?data.get(key):null,
  setItem:(key,value)=>data.set(key,String(value)),
  removeItem:key=>data.delete(key),
  clear:()=>data.clear(),
  key:index=>[...data.keys()][index]??null,
  get length(){return data.size}
};

globalThis.window=globalThis;
globalThis.addEventListener=()=>{};
globalThis.removeEventListener=()=>{};

globalThis.document={
  addEventListener(){},
  removeEventListener(){},
  createElement(){return{innerHTML:'',querySelectorAll(){return[]},append(){},replaceWith(){},remove(){},setAttribute(){},removeAttribute(){},hasAttribute(){return false},get attributes(){return[]},tagName:'DIV',childNodes:[],children:[]}},
  querySelector(){return null}
};

await import('../www/companion-integration.js?companion-test');
await import('../www/core-library.js?companion-core-test');
await import('../www/security-engine.js?companion-security-test');

const C=globalThis.MSACompanion;
const P=globalThis.MSAProjects;
const S=globalThis.MSASecurity;
assert.ok(C,'MSACompanion must register');

const project={id:'p1',type:'document',title:'Incident / Summary',content:'<p>Hello</p>',updated:1};
P.write([project]);

const manifest=C.createManifest({
  workflow:'model-assisted',
  taskType:'coding',
  request:'Review this local project and provide the safest next coding steps.',
  project,
  authorization:{confirmed:true,scope:'user-owned-or-authorized-project'}
});
assert.equal(manifest.contractVersion,'1.0');
assert.equal(manifest.target,'myai');
assert.equal(manifest.taskType,'coding');
assert.equal(manifest.authorization.confirmed,true);
assert.ok(manifest.selectedFiles.length===1,'manifest must include selected-file metadata only');
assert.ok(!manifest.selectedFiles[0].name.includes('/'),'selected file metadata must not keep path separators');
assert.throws(()=>C.createManifest({workflow:'desktop-lola',taskType:'office',request:'x',project,authorization:{confirmed:false,scope:'none'}}),/Authorization confirmation is required/);
assert.throws(()=>C.createManifest({workflow:'model-assisted',taskType:'coding',request:'x'.repeat(C.LIMITS.requestChars+1),project,authorization:{confirmed:true,scope:'user-owned-or-authorized-project'}}),/Request is too large/);

const json=C.manifestToJSON(manifest);
const markdown=C.manifestToMarkdown(manifest);
assert.ok(json.includes('"contractVersion": "1.0"'),'JSON export must include contract version');
assert.ok(markdown.includes('Selected files metadata only'),'Markdown export must include selected-file metadata section');
assert.ok(markdown.includes('Desktop Lola runs outside Android'),'Markdown export must document desktop-only Lola');

const result={
  contractVersion:'1.0',
  jobId:'job_companion_1',
  status:'completed',
  provider:'myai',
  summary:'Use <script>alert(1)</script> only as escaped text.',
  sections:[{title:'Plan',format:'markdown',content:'<b>safe</b>\n- keep it local'}],
  findings:[{title:'Offline check',severity:'info',details:'No upload occurred.'}],
  artifacts:[{label:'Checklist',type:'text',value:'manual next steps',digest:'sha256:demo',sizeBytes:17}],
  warnings:['Desktop Lola remains a manual workflow.'],
  provenance:{tool:'myai',toolVersion:'1.0',createdAt:'2026-09-24T04:01:00.000Z'},
  createdAt:'2026-09-24T04:01:00.000Z'
};

const imported=C.importResultIntoProject('p1',JSON.stringify(result));
assert.equal(imported.jobId,'job_companion_1');
assert.equal(P.get('p1').companion.imports[0].result.provider,'myai');
assert.equal(P.get('p1').companion.imports[0].result.status,'completed');

const rendered=C.renderResult(result);
assert.ok(!rendered.includes('<script>alert(1)</script>'),'rendered result must not inject raw script HTML');
assert.ok(rendered.includes('&lt;script&gt;alert(1)&lt;/script&gt;'),'rendered result must escape summary HTML');
assert.ok(rendered.includes('&lt;b&gt;safe&lt;/b&gt;'),'rendered sections must escape markup');

assert.throws(()=>C.importResultIntoProject('p1',JSON.stringify(result)),/already imported/,'duplicate imports must be rejected');
assert.throws(()=>C.importResultIntoProject('p1',JSON.stringify({...result,jobId:'job_companion_path',artifacts:[{label:'Checklist',type:'text',value:'../secret.txt'}]})),/path-like/,'path-like artifact payloads must be rejected');
assert.throws(()=>C.validateResult({...result,jobId:'job_companion_over',summary:'x'.repeat(C.LIMITS.resultSummaryChars+1)}),/Result summary is too large/,'oversized summaries must be rejected');

const backup={
  schema:1,
  app:'MSA One',
  values:{
    msaOneProjectsV1:JSON.stringify([{...project,companion:{imports:[{result:{...result,jobId:'job_companion_bad',artifacts:[{label:'Checklist',type:'text',value:'../secret.txt'}]}}]}}])
  }
};
const restored=S.parseBackupText(JSON.stringify(backup),['msaOneProjectsV1']);
const restoredProjects=JSON.parse(restored.values.msaOneProjectsV1);
assert.equal(restoredProjects[0].companion.imports.length,0,'recovery should drop malformed stored companion evidence instead of restoring it');

data.set('msaOneProjectsV1','{broken json');
P.invalidate();
const recovered=P.all()[0];
assert.equal(recovered.companion.imports[0].jobId,'job_companion_1','project recovery must preserve last-good companion evidence');

console.log('companion manifest/export/import/recovery contract passed');
