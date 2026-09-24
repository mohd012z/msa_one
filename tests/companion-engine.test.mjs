import assert from 'node:assert/strict';

const store=new Map();
globalThis.localStorage={
  getItem:key=>store.has(key)?store.get(key):null,
  setItem:(key,value)=>store.set(key,String(value)),
  removeItem:key=>store.delete(key),
  clear:()=>store.clear()
};

const mirrored=[];
globalThis.MSAStorage={mirror:(key,value)=>mirrored.push([key,String(value)])};
globalThis.MSAAppManifest={buildId:'MSA-ONE-54',version:'54.0.0'};
globalThis.MSACore={safeName:value=>String(value||'').trim().toLowerCase().replace(/[^\w-]+/g,'-').replace(/^-+|-+$/g,'')||'msa-patcher-handoff'};
globalThis.MSASecurity={sanitizeProject:project=>project};

const projectStore=[
  {id:'doc1',type:'document',title:'Authorized Project',content:'<p>Base document</p>',updated:1},
  {id:'html1',type:'html',title:'Authorized HTML',content:'<!doctype html><html><body><h1>Base</h1></body></html>',updated:2},
  {id:'sheet1',type:'spreadsheet',title:'Spreadsheet Draft',content:'{}',updated:3}
];
globalThis.MSAProjects={
  all:()=>projectStore,
  get:id=>projectStore.find(project=>project.id===id),
  upsert:project=>{
    const index=projectStore.findIndex(item=>item.id===project.id);
    if(index>=0)projectStore[index]=project;
    else projectStore.unshift(project);
    return project;
  }
};

await import('../www/companion-engine.js');
const Companion=globalThis.MSACompanion;
assert.ok(Companion,'MSACompanion must register');

const manifest=Companion.createManifest({
  title:'Patch auth flow',
  taskKind:'coding',
  targets:['in_ai','lola'],
  projectId:'doc1',
  metadata:{title:true,type:true},
  summary:'Review the authorized patch plan.',
  selectedText:'function patchAuth(){ return true; }'
});
assert.equal(manifest.kind,'msa-one-companion-handoff');
assert.deepEqual(manifest.targets,['in_ai','lola']);
assert.deepEqual(manifest.selectedMetadata.project,{title:'Authorized Project',type:'document'});
assert.ok(!('id' in manifest.selectedMetadata.project),'unselected metadata must not be included');
assert.equal(manifest.request.selectedText,'function patchAuth(){ return true; }');
assert.ok(!manifest.request.selectedText.includes('Base document'),'project content must not be auto-exported');

const markdown=Companion.manifestToMarkdown(manifest);
assert.ok(markdown.includes('## Transfer rules'),'handoff markdown must document transfer rules');
assert.ok(markdown.includes('Lola operations are desktop-only'),'handoff markdown must distinguish Lola desktop operations');

Companion.saveState({draft:{title:'Saved handoff',taskKind:'office',targets:['lola'],metadata:{id:true}}});
assert.equal(Companion.loadState().draft.title,'Saved handoff','companion draft state must persist locally');
assert.equal(mirrored.at(-1)?.[0],'msaCompanionStateV1','companion state must mirror into shared storage');

const rawResult=JSON.stringify({
  schemaVersion:1,
  kind:'msa-one-companion-result',
  source:'in_ai',
  operationMode:'model-assisted',
  taskKind:'coding',
  title:'Model review',
  summary:'<b>Use text only</b>',
  sections:[
    {label:'Plan',type:'text',text:'Use <script>alert(1)</script> plain text.'},
    {label:'Checklist',type:'list',items:['Review files','Keep secrets local']},
    {label:'Structured',type:'json',data:{token:'<secret>',status:true}}
  ],
  warnings:['Never upload secrets'],
  nextSteps:['Apply the approved patch manually']
});

const validated=Companion.validateResultPayload(rawResult);
assert.equal(validated.operationMode,'model-assisted');
assert.equal(validated.sections.length,3,'validated companion result must preserve bounded sections');

const rendered=Companion.renderResultHTML(validated);
assert.ok(rendered.includes('Model-assisted result'),'rendered result must label model-assisted imports');
assert.ok(rendered.includes('&lt;script&gt;'),'rendered result must escape untrusted text');
assert.ok(!rendered.includes('<script>alert(1)</script>'),'rendered result must not inject script tags');

const importedToProject=Companion.importResultPayload(rawResult,{targetProjectId:'doc1'});
assert.equal(importedToProject.importedTo,'project','document targets must import into the selected project');
assert.ok(globalThis.MSAProjects.get('doc1').content.includes('Companion import'),'imported project must receive a structured evidence block');
assert.ok(!globalThis.MSAProjects.get('doc1').content.includes('<script>alert(1)</script>'),'imported project content must stay sanitized');

const importedToEvidence=Companion.importResultPayload({
  schemaVersion:1,
  kind:'msa-one-companion-result',
  source:'lola',
  operationMode:'desktop-lola',
  taskKind:'deep-dive',
  title:'Desktop companion findings',
  summary:'Desktop-only workflow',
  sections:[{label:'Findings',type:'text',text:'Run on desktop only.'}]
},{targetProjectId:'sheet1'});
assert.equal(importedToEvidence.importedTo,'evidence','non-document targets must fall back to the local evidence area');
assert.ok(globalThis.MSAProjects.get('msa_companion_evidence')?.content.includes('Desktop-only Lola operation'),'evidence area must preserve the Lola desktop-only label');

assert.throws(()=>Companion.validateResultPayload('x'.repeat(600000)),/safe import size/,'oversized results must be rejected before import');

console.log('companion handoff/import contract passed');
