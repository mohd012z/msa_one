(()=>{
  const STORAGE_KEY='msaLolaStateV1',MANIFEST_SCHEMA='msa.lola.manifest.v1',RESULT_SCHEMA='msa.lola.result.v1';
  const LIMITS={stateBytes:512*1024,resultBytes:1024*1024,reports:24,text:160,notes:1200,findings:200,evidence:200,snippet:4000};
  const PROFILES={
    'source-security-scan':{title:'Source / security scan',contextKind:'source-tree',options:[
      {id:'semgrepRules',label:'Semgrep rule review',desc:'Request Lola Semgrep/security findings for the selected source tree.',default:true},
      {id:'dependencyInventory',label:'Dependency inventory',desc:'Include dependency/package inventory notes in the result.',default:true},
      {id:'changedFilesOnly',label:'Focus scope manually',desc:'Tell the desktop operator they may limit analysis to the files you hand over.',default:false}
    ]},
    'apk-inspection':{title:'APK inspection',contextKind:'apk',options:[
      {id:'manifestSummary',label:'Manifest summary',desc:'Ask Lola to summarize AndroidManifest/package metadata.',default:true},
      {id:'permissionReview',label:'Permission review',desc:'Include permission, component, and exported-surface notes.',default:true},
      {id:'signingOverview',label:'Signing overview',desc:'Include signature/signing metadata when the desktop tools can read it.',default:false}
    ]}
  };
  function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function text(v,max=LIMITS.text){return String(v??'').trim().slice(0,max)}
  function longText(v,max=LIMITS.notes){return String(v??'').trim().slice(0,max)}
  function bool(v){return v===true||v==='true'||v===1||v==='1'||v==='on'}
  function iso(v){const s=String(v||'').trim();return s&&/^\d{4}-\d{2}-\d{2}T/.test(s)?s:new Date().toISOString()}
  function uid(prefix='lola'){return(globalThis.MSACore?.uid?.(prefix)||prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)).slice(0,160)}
  function emptyState(){return{schema:1,draft:normalizeDraft({}),reports:[],lastManifest:null}}
  function optionsFor(profile){return PROFILES[profile]||PROFILES['source-security-scan']}
  function normalizeOptions(profile,raw){
    const out={};
    for(const option of optionsFor(profile).options)out[option.id]=raw&&option.id in raw?bool(raw[option.id]):!!option.default;
    return out;
  }
  function normalizeDraft(raw){
    const profile=raw?.profile in PROFILES?raw.profile:'source-security-scan';
    return{
      projectId:text(raw?.projectId,160),
      profile,
      contextLabel:text(raw?.contextLabel,160),
      packageName:text(raw?.packageName,160),
      notes:longText(raw?.notes,1200),
      options:normalizeOptions(profile,raw?.options||{})
    };
  }
  function normalizeManifest(raw){
    if(!raw||typeof raw!=='object')return null;
    const profile=raw?.job?.profile||raw?.job?.type;
    if(!(profile in PROFILES)||raw.schema!==MANIFEST_SCHEMA)return null;
    return{
      schema:MANIFEST_SCHEMA,
      manifestVersion:Number(raw.manifestVersion)||1,
      createdAt:iso(raw.createdAt),
      sourceApp:{name:text(raw.sourceApp?.name,80),project:text(raw.sourceApp?.project,80)},
      companion:{name:text(raw.companion?.name,80),repository:text(raw.companion?.repository,240),execution:text(raw.companion?.execution,120)},
      job:{id:text(raw.job?.id,160),type:profile,profile,options:normalizeOptions(profile,raw.job?.options)},
      context:{
        project:raw.context?.project?{id:text(raw.context.project.id,160),title:text(raw.context.project.title,160),type:text(raw.context.project.type,80)}:null,
        input:raw.context?.input?{kind:text(raw.context.input.kind,80),label:text(raw.context.input.label,160)}:null,
        packageName:text(raw.context?.packageName,160),
        notes:longText(raw.context?.notes,1200)
      },
      provenance:{generatedBy:text(raw.provenance?.generatedBy,160),transfer:text(raw.provenance?.transfer,160),localOnly:!!raw.provenance?.localOnly},
      limitations:(Array.isArray(raw.limitations)?raw.limitations:[]).slice(0,12).map(v=>text(v,240))
    };
  }
  function normalizeFinding(item){
    if(!item||typeof item!=='object')throw new Error('Lola finding entry is invalid');
    return{
      id:text(item.id,120),
      title:text(item.title||'Finding',160),
      severity:text(item.severity||'info',40),
      confidence:text(item.confidence,40),
      message:longText(item.message,1200),
      path:text(item.path,240),
      line:Math.max(0,Number(item.line)||0),
      snippet:longText(item.snippet,LIMITS.snippet),
      tags:(Array.isArray(item.tags)?item.tags:[]).slice(0,12).map(v=>text(v,60))
    };
  }
  function normalizeEvidence(item){
    if(!item||typeof item!=='object')throw new Error('Lola evidence entry is invalid');
    return{
      kind:text(item.kind||'note',80),
      label:text(item.label||'Evidence',160),
      detail:longText(item.detail,1200),
      path:text(item.path,240),
      digest:text(item.digest,160),
      command:text(item.command,240),
      sizeBytes:Math.max(0,Number(item.sizeBytes)||0)
    };
  }
  function normalizeResult(raw){
    if(!raw||typeof raw!=='object')throw new Error('Lola result JSON is invalid');
    if(raw.schema!==RESULT_SCHEMA)throw new Error('This file does not use the supported Lola result schema');
    const profile=text(raw.profile||'',80);
    if(!(profile in PROFILES))throw new Error('Unsupported Lola profile in result');
    const findings=Array.isArray(raw.findings)?raw.findings:[];
    const evidence=Array.isArray(raw.evidence)?raw.evidence:[];
    if(findings.length>LIMITS.findings)throw new Error('Lola result contains too many findings');
    if(evidence.length>LIMITS.evidence)throw new Error('Lola result contains too many evidence entries');
    return{
      schema:RESULT_SCHEMA,
      resultVersion:Number(raw.resultVersion)||1,
      manifestVersion:Number(raw.manifestVersion)||1,
      manifestId:text(raw.manifestId,160),
      profile,
      generator:{tool:text(raw.generator?.tool||'lola',120),version:text(raw.generator?.version,80),repository:text(raw.generator?.repository,240)},
      provenance:{generatedAt:iso(raw.provenance?.generatedAt),sourceHost:text(raw.provenance?.sourceHost,120),sourcePath:text(raw.provenance?.sourcePath,240)},
      association:{projectId:text(raw.association?.projectId,160),projectTitle:text(raw.association?.projectTitle,160)},
      summary:{
        headline:text(raw.summary?.headline||optionsFor(profile).title,160),
        verdict:text(raw.summary?.verdict||'review',40),
        findingCount:Math.max(0,Number(raw.summary?.findingCount)||findings.length),
        evidenceCount:Math.max(0,Number(raw.summary?.evidenceCount)||evidence.length)
      },
      findings:findings.map(normalizeFinding),
      evidence:evidence.map(normalizeEvidence),
      limitations:(Array.isArray(raw.limitations)?raw.limitations:[]).slice(0,12).map(v=>text(v,240))
    };
  }
  function normalizeStoredReport(item){
    if(!item||typeof item!=='object')return null;
    try{return{id:text(item.id,160)||uid('lola_report'),importedAt:iso(item.importedAt),projectId:text(item.projectId,160),report:normalizeResult(item.report)}}catch{return null}
  }
  function normalizeState(raw){
    try{
      const value=typeof raw==='string'?JSON.parse(raw):raw;
      if(!value||typeof value!=='object')return emptyState();
      const state=emptyState();
      state.draft=normalizeDraft(value.draft||{});
      state.reports=(Array.isArray(value.reports)?value.reports:[]).map(normalizeStoredReport).filter(Boolean).slice(0,LIMITS.reports);
      state.lastManifest=normalizeManifest(value.lastManifest);
      return state;
    }catch{return emptyState()}
  }
  function saveState(state){
    const safe=normalizeState(state),raw=JSON.stringify(safe);
    if(raw.length>LIMITS.stateBytes)throw new Error('Lola state is too large to keep on-device');
    try{localStorage.setItem(STORAGE_KEY,raw);globalThis.MSAStorage?.mirror?.(STORAGE_KEY,raw)}catch{}
    return safe;
  }
  function loadState(){return normalizeState(typeof localStorage!=='undefined'?localStorage.getItem(STORAGE_KEY):null)}
  function recover(){return saveState(loadState())}
  function projectList(){try{return(globalThis.MSAProjects?.all?.()||[]).slice(0,50)}catch{return[]}}
  function buildManifest(input){
    const draft=normalizeDraft(input||loadState().draft),profile=draft.profile,project=draft.projectId?globalThis.MSAProjects?.get?.(draft.projectId):null,context={};
    if(project&&draft.projectId)context.project={id:text(project.id,160),title:text(project.title||'',160),type:text(project.type||'',80)};
    if(draft.contextLabel)context.input={kind:optionsFor(profile).contextKind,label:draft.contextLabel};
    if(profile==='apk-inspection'&&draft.packageName)context.packageName=draft.packageName;
    if(draft.notes)context.notes=draft.notes;
    return{
      schema:MANIFEST_SCHEMA,
      manifestVersion:1,
      createdAt:new Date().toISOString(),
      sourceApp:{name:'MSA One',project:'msapatcher'},
      companion:{name:'Lola',repository:'https://github.com/mohd012z/lola',execution:'desktop-only'},
      job:{id:uid('lola_job'),type:profile,profile,options:normalizeOptions(profile,draft.options)},
      context,
      provenance:{generatedBy:'MSA One Lola Companion',transfer:'manual export/import only',localOnly:true},
      limitations:[
        'MSA One does not run Python, PowerShell, Semgrep, apktool, Frida, or patching inside Android.',
        'Move the selected source tree or APK to a desktop environment before running Lola.',
        'Review the manifest before sharing it; it contains only the labels and project references you selected.'
      ]
    };
  }
  function parseResultText(raw){
    const textValue=String(raw??'');
    if(textValue.length>LIMITS.resultBytes)throw new Error('Lola result is too large for safe local import');
    let data;try{data=JSON.parse(textValue)}catch{throw new Error('Lola result JSON is invalid')}
    return normalizeResult(data);
  }
  function storeImportedReport(raw,projectId=''){
    const report=typeof raw==='string'?parseResultText(raw):normalizeResult(raw);
    return{id:uid('lola_report'),importedAt:new Date().toISOString(),projectId:text(projectId||report.association.projectId,160),report};
  }
  function renderManifestText(manifest){return JSON.stringify(manifest,null,2)}
  function projectName(id){const p=id?globalThis.MSAProjects?.get?.(id):null;return p?.title||''}
  function reportCards(reports){
    if(!reports.length)return'<div class="ws-empty">No Lola reports imported yet.</div>';
    return reports.map(entry=>{
      const report=entry.report,project=entry.projectId?projectName(entry.projectId)||report.association.projectTitle||entry.projectId:report.association.projectTitle||'Unlinked';
      return'<details class="lola-report"><summary>'+esc(report.summary.headline||optionsFor(report.profile).title)+'</summary><div class="lola-report-meta"><span class="lola-pill">'+esc(optionsFor(report.profile).title)+'</span><span class="lola-pill">'+esc(report.summary.verdict||'review')+'</span><span class="lola-pill">'+report.summary.findingCount+' finding'+(report.summary.findingCount===1?'':'s')+'</span><span class="lola-pill">'+report.summary.evidenceCount+' evidence item'+(report.summary.evidenceCount===1?'':'s')+'</span><span class="lola-pill">'+esc(project)+'</span></div>'+(entry.projectId?'<div><button class="ws-link" data-lola-open-project="'+esc(entry.projectId)+'">Open linked project</button></div>':'')+'<div class="lola-kv"><div><b>Generator</b><code>'+esc((report.generator.tool||'lola')+(report.generator.version?' '+report.generator.version:''))+'</code></div><div><b>Source host</b><code>'+esc(report.provenance.sourceHost||'desktop companion')+'</code></div></div>'+(report.findings.length?'<h4>Findings</h4><ol class="lola-plain">'+report.findings.slice(0,12).map(f=>'<li><b>'+esc(f.title)+'</b> · '+esc(f.severity||'info')+(f.path?' · '+esc(f.path)+(f.line?' :'+f.line:''):'')+(f.message?'<div>'+esc(f.message)+'</div>':'')+(f.snippet?'<code>'+esc(f.snippet)+'</code>':'')+'</li>').join('')+'</ol>':'<p>No findings were listed in this report.</p>')+(report.evidence.length?'<h4>Evidence</h4><ol class="lola-plain">'+report.evidence.slice(0,12).map(e=>'<li><b>'+esc(e.label)+'</b> · '+esc(e.kind||'note')+(e.detail?'<div>'+esc(e.detail)+'</div>':'')+(e.command?'<code>'+esc(e.command)+'</code>':'')+'</li>').join('')+'</ol>':'')+(report.limitations.length?'<h4>Companion notes</h4><ul class="lola-plain">'+report.limitations.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul>':'')+'</details>';
    }).join('');
  }
  function optionChecks(draft){
    return optionsFor(draft.profile).options.map(option=>'<label><input type="checkbox" data-lola-option="'+option.id+'" '+(draft.options[option.id]?'checked':'')+'><span><b>'+esc(option.label)+'</b><small>'+esc(option.desc)+'</small></span></label>').join('');
  }
  function sectionHTML(){
    const state=loadState(),draft=state.draft,projects=projectList();
    return'<section class="ws-section" data-lola-section id="lola-companion"><div class="ws-section-head"><h2>Lola Companion</h2><small>Desktop-only handoff + local report viewer</small></div><div class="lola-panel"><p>Prepare a truthful handoff for the sibling <code>mohd012z/lola</code> desktop toolchain, then import the resulting JSON evidence back into MSA One. No local files are uploaded automatically.</p><div class="lola-note"><b>Desktop companion required</b><div>The Android app can prepare manifests and view imported evidence, but Lola analysis runs on a desktop environment using its Python/PowerShell tooling.</div></div><div class="lola-grid"><label class="lola-field"><span>Link existing MSA project</span><select data-lola-project><option value="">No linked project</option>'+projects.map(p=>'<option value="'+esc(p.id)+'" '+(draft.projectId===p.id?'selected':'')+'>'+esc((p.title||'Untitled')+' · '+(p.type||'project'))+'</option>').join('')+'</select></label><label class="lola-field"><span>Analysis profile</span><select data-lola-profile>'+Object.entries(PROFILES).map(([id,profile])=>'<option value="'+id+'" '+(draft.profile===id?'selected':'')+'>'+esc(profile.title)+'</option>').join('')+'</select></label><label class="lola-field"><span>Local project / file / APK label</span><input data-lola-label maxlength="160" placeholder="Example: client-app.apk or ./source-tree" value="'+esc(draft.contextLabel)+'"></label><label class="lola-field"><span>Android package name (optional)</span><input data-lola-package maxlength="160" placeholder="com.example.app" value="'+esc(draft.packageName)+'"></label></div><label class="lola-field"><span>Operator notes for the desktop companion (optional)</span><textarea data-lola-notes maxlength="1200" placeholder="Describe the source tree, APK, or scope you plan to move to the desktop toolchain.">'+esc(draft.notes)+'</textarea></label><div class="lola-checks">'+optionChecks(draft)+'</div><div class="lola-actions"><button class="lola-btn primary" data-lola-create>Create handoff manifest</button><button class="lola-btn" data-lola-import>Import Lola result</button><button class="lola-btn" data-lola-focus>Why desktop?</button></div><div class="lola-note"><b>Adapter-ready contract</b><div>Map <code>source-security-scan</code> to Lola desktop entry points such as <code>scan-security.ps1</code>, and map <code>apk-inspection</code> to Lola APK tooling such as <code>scan-apk.ps1</code> / <code>analyze-apk.py</code>. The companion should emit <code>'+RESULT_SCHEMA+'</code>.</div></div><h3>Last generated manifest</h3>'+(state.lastManifest?'<pre class="lola-pre">'+esc(renderManifestText(state.lastManifest))+'</pre>':'<div class="ws-empty">Create a manifest to generate a portable JSON handoff file.</div>')+'<h3 style="margin-top:18px">Imported Lola reports</h3>'+reportCards(state.reports)+'</div></section>';
  }
  function readDraftFrom(root){
    const profile=root.querySelector('[data-lola-profile]')?.value||'source-security-scan',options={};
    for(const option of optionsFor(profile).options)options[option.id]=!!root.querySelector('[data-lola-option="'+option.id+'"]')?.checked;
    return normalizeDraft({
      projectId:root.querySelector('[data-lola-project]')?.value||'',
      profile,
      contextLabel:root.querySelector('[data-lola-label]')?.value||'',
      packageName:root.querySelector('[data-lola-package]')?.value||'',
      notes:root.querySelector('[data-lola-notes]')?.value||'',
      options
    });
  }
  function updateDraft(root,{rerender=false}={}){
    const state=loadState();
    state.draft=readDraftFrom(root);
    saveState(state);
    if(rerender)globalThis.MSAToolsCenter?.render?.();
    return state;
  }
  async function pickJSON(){
    if(globalThis.MSACore?.pickFile)return globalThis.MSACore.pickFile({accept:'application/json,.json'});
    return new Promise(resolve=>{
      const input=document.createElement('input');input.type='file';input.accept='application/json,.json';input.hidden=true;
      input.onchange=()=>{const file=input.files?.[0]||null;input.remove();resolve(file)};
      input.oncancel=()=>{input.remove();resolve(null)};
      document.body.appendChild(input);input.click();
    });
  }
  async function importResult(root){
    const draft=updateDraft(root).draft,file=await pickJSON();
    if(!file)return;
    if(file.size>LIMITS.resultBytes)throw new Error('Lola result is too large for safe local import');
    const stored=storeImportedReport(await file.text(),draft.projectId);
    const state=loadState();state.draft=draft;state.reports.unshift(stored);state.reports=state.reports.slice(0,LIMITS.reports);saveState(state);return stored;
  }
  function wireSection(root){
    const section=root.querySelector('[data-lola-section]');if(!section)return;
    section.querySelector('[data-lola-profile]')?.addEventListener('change',()=>updateDraft(section,{rerender:true}));
    for(const selector of ['[data-lola-project]','[data-lola-label]','[data-lola-package]','[data-lola-notes]'])section.querySelector(selector)?.addEventListener('change',()=>updateDraft(section));
    section.querySelectorAll('[data-lola-option]').forEach(box=>box.addEventListener('change',()=>updateDraft(section)));
    section.querySelector('[data-lola-create]')?.addEventListener('click',()=>{
      try{
        const state=updateDraft(section),manifest=buildManifest(state.draft),next=loadState();
        next.draft=state.draft;next.lastManifest=manifest;saveState(next);
        globalThis.MSACore?.download?.('msa-one-lola-manifest.json',JSON.stringify(manifest,null,2),'application/json');
        globalThis.MSAHelper?.success?.('Lola manifest exported. Move the selected source tree or APK to a desktop environment before running Lola.');
        globalThis.MSAToolsCenter?.render?.();
      }catch(e){globalThis.MSAHelper?.error?.('Lola manifest could not be created: '+e.message)}
    });
    section.querySelector('[data-lola-import]')?.addEventListener('click',async()=>{
      try{
        await importResult(section);
        globalThis.MSAHelper?.success?.('Lola result imported and linked locally.');
        globalThis.MSAToolsCenter?.render?.();
      }catch(e){globalThis.MSAHelper?.error?.('Lola result could not be imported: '+e.message)}
    });
    section.querySelector('[data-lola-focus]')?.addEventListener('click',()=>focus());
    section.querySelectorAll('[data-lola-open-project]').forEach(button=>button.addEventListener('click',()=>globalThis.MSAFiles?.openProject?.(button.dataset.lolaOpenProject)));
  }
  function focus(){const node=document.getElementById('lola-companion');if(!node)return;node.scrollIntoView({behavior:'smooth',block:'start'});globalThis.MSAHelper?.notify?.('Desktop-only: export the manifest, move the authorized source tree or APK to your desktop, run Lola there, then import the JSON result back here.','info')}
  if(typeof document!=='undefined'){document.addEventListener('DOMContentLoaded',recover);setTimeout(recover,500)}
  globalThis.MSALolaCompanion={STORAGE_KEY,MANIFEST_SCHEMA,RESULT_SCHEMA,PROFILES,buildManifest,parseResultText,storeImportedReport,normalizeState,recover,loadState,saveState,sectionHTML,wireSection,reportCards,focus};
})();
