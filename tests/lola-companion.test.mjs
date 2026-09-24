import assert from 'node:assert/strict';

const data=new Map();
globalThis.localStorage={
  getItem:key=>data.has(key)?data.get(key):null,
  setItem:(key,value)=>data.set(key,String(value)),
  removeItem:key=>data.delete(key),
  clear:()=>data.clear()
};
let mirrored=null;
globalThis.MSAStorage={mirror:(key,value)=>{mirrored={key,value}}};
globalThis.MSAProjects={
  get:id=>id==='p_alpha'?{id:'p_alpha',title:'Alpha Project',type:'document',content:'<p>secret</p>'}:null,
  all:()=>[{id:'p_alpha',title:'Alpha Project',type:'document'}]
};

await import('../www/lola-companion.js');
const Lola=globalThis.MSALolaCompanion;

assert.ok(Lola,'MSALolaCompanion must register');
assert.equal(Lola.STORAGE_KEY,'msaLolaStateV1');

const manifest=Lola.buildManifest({
  projectId:'p_alpha',
  profile:'apk-inspection',
  contextLabel:'client-app.apk',
  packageName:'com.example.client',
  notes:'Authorized internal review.',
  options:{manifestSummary:true,permissionReview:true,signingOverview:false}
});
assert.equal(manifest.schema,'msa.lola.manifest.v1');
assert.equal(manifest.job.profile,'apk-inspection');
assert.equal(manifest.context.project.title,'Alpha Project');
assert.equal(manifest.context.input.label,'client-app.apk');
assert.equal(manifest.context.packageName,'com.example.client');
assert.ok(!JSON.stringify(manifest).includes('<p>secret</p>'),'manifest must not embed local project content');

const resultJSON=JSON.stringify({
  schema:'msa.lola.result.v1',
  resultVersion:1,
  manifestVersion:1,
  manifestId:manifest.job.id,
  profile:'source-security-scan',
  generator:{tool:'lola',version:'adapter'},
  provenance:{generatedAt:'2026-09-24T00:00:00.000Z',sourceHost:'desktop-a'},
  association:{projectId:'p_alpha',projectTitle:'Alpha Project'},
  summary:{headline:'<b>Desktop review</b>',verdict:'review'},
  findings:[{id:'f1',title:'<script>alert(1)</script>',severity:'high',message:'Review token path',path:'src/auth.js',line:8,snippet:'const token = "x";'}],
  evidence:[{kind:'command',label:'scan-security.ps1',detail:'Ran on desktop',command:'.\\\\scan-security.ps1 "C:\\\\Projects\\\\authorized"'}],
  limitations:['Desktop companion result']
});
const parsed=Lola.parseResultText(resultJSON);
assert.equal(parsed.findings.length,1);
assert.equal(parsed.evidence.length,1);
const cards=Lola.reportCards([{id:'r1',importedAt:'2026-09-24T00:00:00.000Z',projectId:'p_alpha',report:parsed}]);
assert.ok(cards.includes('&lt;script&gt;alert(1)&lt;/script&gt;'),'report rendering must escape imported finding titles');
assert.ok(cards.includes('&lt;b&gt;Desktop review&lt;/b&gt;'),'report rendering must escape imported headlines');

assert.throws(()=>Lola.parseResultText(JSON.stringify({
  schema:'msa.lola.result.v1',
  profile:'source-security-scan',
  findings:new Array(201).fill({title:'x'}),
  evidence:[]
})),/too many findings/i);

data.set('msaLolaStateV1','{"broken":');
const recovered=Lola.recover();
assert.equal(recovered.draft.profile,'source-security-scan');
assert.equal(mirrored.key,'msaLolaStateV1');

const stored=Lola.storeImportedReport(resultJSON,'p_alpha');
const saved=Lola.saveState({draft:recovered.draft,reports:[stored],lastManifest:manifest});
assert.equal(saved.reports[0].projectId,'p_alpha');
assert.equal(JSON.parse(data.get('msaLolaStateV1')).reports.length,1);

console.log('lola companion manifest/result/storage contract passed');
