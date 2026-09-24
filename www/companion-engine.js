(()=>{'use strict';
  const KEY='msaCompanionStateV1';
  const EVIDENCE_ID='msa_companion_evidence';
  const SCHEMA_VERSION=1;
  const IMPORT_MAX_BYTES=512*1024;
  const MAX_TEXT=12000;
  const MAX_TITLE=140;
  const MAX_ITEMS=24;
  const TASK_KINDS=['coding','office','apk-creator','development','deep-dive'];
  const RESULT_MODES=['local-template','model-assisted','desktop-lola'];
  const TARGETS=['in_ai','lola'];
  const DEFAULTS=Object.freeze({draft:{title:'',taskKind:'development',summary:'',selectedText:'',projectId:'',targets:['in_ai'],metadata:{title:true,type:true}},exports:[],imports:[],latestManifest:null,latestResult:null});

  function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function clampText(v,max=MAX_TEXT){return String(v??'').trim().slice(0,max)}
  function list(v,max=MAX_ITEMS,size=320){
    const items=Array.isArray(v)?v:[];
    return items.map(x=>clampText(x,size)).filter(Boolean).slice(0,max);
  }
  function boolObject(v,allowed=['id','title','type','updated']){
    const out={};
    for(const key of allowed)if(v&&v[key])out[key]=true;
    return out;
  }
  function targets(v){
    const out=[...(Array.isArray(v)?v:[v])].map(x=>String(x||'').trim()).filter(x=>TARGETS.includes(x));
    return out.length?out:['in_ai'];
  }
  function taskKind(v){return TASK_KINDS.includes(v)?v:'development'}
  function mode(v){return RESULT_MODES.includes(v)?v:'model-assisted'}
  function now(){return new Date().toISOString()}
  function manifestName(manifest,ext){return (globalThis.MSACore?.safeName?.(manifest.title||'msa-patcher-handoff')||'msa-patcher-handoff')+'-'+manifest.taskKind+'.'+ext}
  function stateSanitized(v){
    const draft=v&&typeof v==='object'?v.draft||{}:{};
    return{
      draft:{
        title:clampText(draft.title,MAX_TITLE),
        taskKind:taskKind(draft.taskKind),
        summary:clampText(draft.summary),
        selectedText:clampText(draft.selectedText),
        projectId:clampText(draft.projectId,120),
        targets:targets(draft.targets),
        metadata:boolObject(draft.metadata)
      },
      exports:(Array.isArray(v?.exports)?v.exports:[]).slice(0,8).map(x=>({
        title:clampText(x?.title,MAX_TITLE),
        taskKind:taskKind(x?.taskKind),
        targets:targets(x?.targets),
        createdAt:clampText(x?.createdAt,40)
      })),
      imports:(Array.isArray(v?.imports)?v.imports:[]).slice(0,8).map(x=>({
        title:clampText(x?.title,MAX_TITLE),
        source:clampText(x?.source,24),
        operationMode:mode(x?.operationMode),
        taskKind:taskKind(x?.taskKind),
        importedTo:clampText(x?.importedTo,24),
        createdAt:clampText(x?.createdAt,40)
      })),
      latestManifest:v?.latestManifest&&typeof v.latestManifest==='object'?v.latestManifest:null,
      latestResult:v?.latestResult&&typeof v.latestResult==='object'?v.latestResult:null
    };
  }
  function loadState(){
    try{
      const raw=localStorage.getItem(KEY);
      if(!raw)return JSON.parse(JSON.stringify(DEFAULTS));
      return {...JSON.parse(JSON.stringify(DEFAULTS)),...stateSanitized(JSON.parse(raw))};
    }catch{return JSON.parse(JSON.stringify(DEFAULTS))}
  }
  function saveState(next){
    const safe={...JSON.parse(JSON.stringify(DEFAULTS)),...stateSanitized(next)};
    const raw=JSON.stringify(safe);
    try{
      localStorage.setItem(KEY,raw);
      globalThis.MSAStorage?.mirror?.(KEY,raw);
    }catch{}
    return safe;
  }
  function patchState(patch){
    return saveState({...loadState(),...patch});
  }
  function projects(){
    try{return [...(globalThis.MSAProjects?.all?.()||[])].sort((a,b)=>(b.updated||0)-(a.updated||0)).slice(0,25)}catch{return[]}
  }
  function projectById(id){return projects().find(x=>x.id===id)||null}
  function pickMetadata(project,include){
    if(!project||!include)return null;
    const out={};
    if(include.id)out.id=String(project.id||'').slice(0,120);
    if(include.title)out.title=String(project.title||'').slice(0,MAX_TITLE);
    if(include.type)out.type=String(project.type||'').slice(0,40);
    if(include.updated)out.updated=Number(project.updated)||null;
    return Object.keys(out).length?out:null;
  }
  function createManifest(options={}){
    const project=projectById(options.projectId);
    const manifest={
      schemaVersion:SCHEMA_VERSION,
      kind:'msa-one-companion-handoff',
      createdAt:now(),
      app:{
        name:'MSA One',
        role:'MSA Patcher',
        buildId:globalThis.MSAAppManifest?.buildId||'unknown',
        version:globalThis.MSAAppManifest?.version||'unknown'
      },
      targets:targets(options.targets),
      taskKind:taskKind(options.taskKind),
      title:clampText(options.title||'MSA Patcher handoff',MAX_TITLE)||'MSA Patcher handoff',
      request:{
        summary:clampText(options.summary),
        selectedText:clampText(options.selectedText),
        questions:list(options.questions,8,240),
        constraints:list(options.constraints,10,240)
      },
      transferRules:[
        'Only transfer this manifest and any separately user-authorized files.',
        'Do not scan the device, auto-upload files, expose secrets, or call undocumented services.',
        'Analyze only projects you are authorized to inspect.'
      ],
      destinations:{
        in_ai:targets(options.targets).includes('in_ai'),
        lola:targets(options.targets).includes('lola')
      }
    };
    const metadata=pickMetadata(project,options.metadata);
    if(metadata)manifest.selectedMetadata={project:metadata};
    return manifest;
  }
  function manifestToMarkdown(manifest){
    const lines=[
      '# '+manifest.title,
      '',
      '- App: '+manifest.app.name+' ('+manifest.app.role+')',
      '- Build: '+manifest.app.buildId+' · '+manifest.app.version,
      '- Task kind: '+manifest.taskKind,
      '- Targets: '+manifest.targets.join(', '),
      '- Created: '+manifest.createdAt,
      ''
    ];
    if(manifest.request.summary){
      lines.push('## Request summary','',manifest.request.summary,'');
    }
    if(manifest.request.selectedText){
      lines.push('## User-selected text','','```text',manifest.request.selectedText,'```','');
    }
    if(manifest.selectedMetadata?.project){
      lines.push('## Selected project metadata','');
      for(const [key,value] of Object.entries(manifest.selectedMetadata.project))lines.push('- '+key+': '+value);
      lines.push('');
    }
    if(manifest.request.questions?.length){
      lines.push('## Questions','');
      for(const item of manifest.request.questions)lines.push('- '+item);
      lines.push('');
    }
    if(manifest.request.constraints?.length){
      lines.push('## Constraints','');
      for(const item of manifest.request.constraints)lines.push('- '+item);
      lines.push('');
    }
    lines.push('## Transfer rules','');
    for(const rule of manifest.transferRules)lines.push('- '+rule);
    lines.push('','## Operation labels','','- Local template results stay on-device inside MSA One.','- Model-assisted results from in_ai are imported as bounded text/structured data only.','- Lola operations are desktop-only and must be run outside the Android app.');
    return lines.join('\n');
  }
  function rememberManifest(manifest,draft){
    const state=loadState();
    return saveState({
      ...state,
      draft:{...state.draft,...draft},
      latestManifest:manifest,
      exports:[{title:manifest.title,taskKind:manifest.taskKind,targets:manifest.targets,createdAt:manifest.createdAt},...state.exports].slice(0,8)
    });
  }
  function downloadManifest(format='json',options={}){
    const manifest=createManifest(options);
    const payload=format==='markdown'?manifestToMarkdown(manifest):JSON.stringify(manifest,null,2);
    const type=format==='markdown'?'text/markdown;charset=utf-8':'application/json';
    globalThis.MSACore?.download?.(manifestName(manifest,format==='markdown'?'md':'json'),payload,type);
    rememberManifest(manifest,options);
    return manifest;
  }
  function sectionNormalized(input){
    const type=['text','list','json','code'].includes(input?.type)?input.type:'text';
    const section={label:clampText(input?.label||'Section',80),type};
    if(type==='list')section.items=list(input?.items,MAX_ITEMS,400);
    else if(type==='json'){
      const source=input?.data&&typeof input.data==='object'?input.data:{};
      const out={};
      for(const [key,value] of Object.entries(source).slice(0,24))out[clampText(key,80)||'field']=clampText(typeof value==='string'?value:JSON.stringify(value),600);
      section.data=out;
    }else section.text=clampText(input?.text||'',type==='code'?6000:MAX_TEXT);
    return section;
  }
  function validateResultPayload(input){
    const raw=typeof input==='string'?input:JSON.stringify(input);
    if(raw.length>IMPORT_MAX_BYTES)throw new Error('Companion result exceeds the safe import size');
    let parsed;
    try{parsed=typeof input==='string'?JSON.parse(input):input}catch{throw new Error('Companion result JSON is invalid')}
    if(!parsed||typeof parsed!=='object')throw new Error('Companion result must be an object');
    if(parsed.kind!=='msa-one-companion-result')throw new Error('Companion result kind is not supported');
    if(Number(parsed.schemaVersion)!==SCHEMA_VERSION)throw new Error('Companion result schema version is not supported');
    const source=String(parsed.source||'').trim();
    if(!['in_ai','lola'].includes(source))throw new Error('Companion result source is not supported');
    const sections=(Array.isArray(parsed.sections)?parsed.sections:[]).slice(0,12).map(sectionNormalized).filter(x=>x.label&&(x.text||x.items?.length||Object.keys(x.data||{}).length));
    return{
      schemaVersion:SCHEMA_VERSION,
      kind:'msa-one-companion-result',
      createdAt:clampText(parsed.createdAt,40)||now(),
      source,
      operationMode:mode(parsed.operationMode),
      taskKind:taskKind(parsed.taskKind),
      title:clampText(parsed.title||'Companion result',MAX_TITLE)||'Companion result',
      summary:clampText(parsed.summary,MAX_TEXT),
      projectHint:clampText(parsed.projectHint,120),
      warnings:list(parsed.warnings,12,320),
      nextSteps:list(parsed.nextSteps,12,320),
      sections
    };
  }
  function modeBadge(result){
    return result.operationMode==='desktop-lola'
      ?{label:'Desktop-only Lola operation',tone:'warn'}
      :result.operationMode==='local-template'
        ?{label:'Local template result',tone:'good'}
        :{label:'Model-assisted result',tone:'info'};
  }
  function renderResultHTML(input){
    const result=input?.kind==='msa-one-companion-result'?input:validateResultPayload(input);
    const badge=modeBadge(result);
    let html='<section class="companion-result-card"><div class="companion-badges"><span class="companion-badge '+badge.tone+'">'+esc(badge.label)+'</span><span class="companion-badge">'+esc(result.source)+'</span><span class="companion-badge">'+esc(result.taskKind)+'</span></div><h3>'+esc(result.title)+'</h3>';
    if(result.summary)html+='<p>'+esc(result.summary)+'</p>';
    for(const section of result.sections){
      html+='<article class="companion-result-section"><strong>'+esc(section.label)+'</strong>';
      if(section.type==='list')html+='<ul>'+section.items.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul>';
      else if(section.type==='json')html+='<pre>'+esc(JSON.stringify(section.data,null,2))+'</pre>';
      else if(section.type==='code')html+='<pre>'+esc(section.text)+'</pre>';
      else html+='<p>'+esc(section.text)+'</p>';
      html+='</article>';
    }
    if(result.warnings.length)html+='<div class="companion-foot"><b>Warnings</b><ul>'+result.warnings.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>';
    if(result.nextSteps.length)html+='<div class="companion-foot"><b>Next steps</b><ul>'+result.nextSteps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>';
    return html+'</section>';
  }
  function resultDocumentHTML(result){
    return '<section><p><b>Companion import · '+esc(result.title)+'</b></p><p>Source: '+esc(result.source)+' · '+esc(modeBadge(result).label)+' · '+esc(result.taskKind)+'</p>'+(result.summary?'<p>'+esc(result.summary)+'</p>':'')+result.sections.map(section=>{
      if(section.type==='list')return '<p><b>'+esc(section.label)+'</b></p><ul>'+section.items.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul>';
      if(section.type==='json'||section.type==='code')return '<p><b>'+esc(section.label)+'</b></p><pre>'+esc(section.type==='json'?JSON.stringify(section.data,null,2):section.text)+'</pre>';
      return '<p><b>'+esc(section.label)+'</b></p><p>'+esc(section.text)+'</p>';
    }).join('')+(result.warnings.length?'<p><b>Warnings</b></p><ul>'+result.warnings.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+(result.nextSteps.length?'<p><b>Next steps</b></p><ul>'+result.nextSteps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+'</section>';
  }
  function mergeIntoHTMLDocument(existing,snippet){
    return String(existing||'')+snippet;
  }
  function mergeIntoHTMLSource(existing,snippet){
    const html=String(existing||'');
    const safeSnippet='\n<section data-msa-companion>\n'+snippet+'\n</section>\n';
    return /<\/body>/i.test(html)?html.replace(/<\/body>/i,safeSnippet+'</body>'):html+safeSnippet;
  }
  function upsertProject(project){
    const safe=globalThis.MSASecurity?.sanitizeProject?.(project)||project;
    globalThis.MSAProjects?.upsert?.(safe,50);
    return safe;
  }
  function upsertEvidence(result){
    const existing=globalThis.MSAProjects?.get?.(EVIDENCE_ID);
    const snippet=resultDocumentHTML(result);
    const project={
      id:EVIDENCE_ID,
      type:'document',
      title:'MSA Patcher Companion Evidence',
      content:mergeIntoHTMLDocument(existing?.content||'',snippet),
      updated:Date.now()
    };
    return upsertProject(project);
  }
  function importResultPayload(input,options={}){
    const result=validateResultPayload(input);
    const targetId=String(options.targetProjectId||'').trim();
    const snippet=resultDocumentHTML(result);
    let target=targetId?globalThis.MSAProjects?.get?.(targetId):null;
    let importedTo='evidence';
    let saved;
    if(target&&target.type==='document'){
      saved=upsertProject({...target,content:mergeIntoHTMLDocument(target.content||'',snippet),updated:Date.now()});
      importedTo='project';
    }else if(target&&target.type==='html'){
      saved=upsertProject({...target,content:mergeIntoHTMLSource(target.content||'',snippet),updated:Date.now()});
      importedTo='project';
    }else{
      saved=upsertEvidence(result);
    }
    const state=loadState();
    saveState({
      ...state,
      latestResult:result,
      imports:[{title:result.title,source:result.source,operationMode:result.operationMode,taskKind:result.taskKind,importedTo,createdAt:now()},...state.imports].slice(0,8)
    });
    return{result,project:saved,importedTo};
  }

  let shell=null;
  function projectOptions(selected=''){
    return ['<option value="">No project metadata</option>',...projects().map(project=>'<option value="'+esc(project.id)+'"'+(project.id===selected?' selected':'')+'>'+esc(project.title||'Untitled')+' · '+esc(project.type)+'</option>')].join('');
  }
  function importOptions(selected=''){
    return '<option value="">Create/update local evidence area</option>'+projects().map(project=>'<option value="'+esc(project.id)+'"'+(project.id===selected?' selected':'')+'>'+esc(project.title||'Untitled')+' · '+esc(project.type)+'</option>').join('');
  }
  function ensureShell(){
    if(typeof document==='undefined')return null;
    if(shell)return shell;
    shell=document.createElement('div');
    shell.className='companion-shell';
    shell.innerHTML='<div class="companion-scrim" data-companion-close></div><section class="companion-panel" role="dialog" aria-modal="true" aria-label="MSA Patcher companion workflow"><header class="companion-head"><div><small>MSA Patcher → in_ai / Lola</small><h2>Companion workflow</h2></div><button class="ws-icon" data-companion-close aria-label="Close">×</button></header><div class="companion-body"><div class="companion-note"><b>Local-first transfer only</b><p>MSA One exports a manual handoff manifest. It does not auto-upload files, scan the device, expose secrets, or run Lola tooling on Android.</p><ul><li>Local template results stay on-device.</li><li>Model-assisted results from <code>in_ai</code> import as bounded text/structured data only.</li><li>Lola operations are desktop-only.</li></ul></div><label><span>Task kind</span><select data-companion-task>'+TASK_KINDS.map(kind=>'<option value="'+kind+'">'+kind+'</option>').join('')+'</select></label><label><span>Manifest title</span><input data-companion-title maxlength="'+MAX_TITLE+'" placeholder="MSA Patcher handoff"></label><label><span>Optional project metadata</span><select data-companion-project></select></label><div class="companion-grid"><label class="companion-check"><input type="checkbox" data-meta="title"> <span>Title</span></label><label class="companion-check"><input type="checkbox" data-meta="type"> <span>Type</span></label><label class="companion-check"><input type="checkbox" data-meta="updated"> <span>Updated</span></label><label class="companion-check"><input type="checkbox" data-meta="id"> <span>Project ID</span></label></div><div class="companion-grid"><label class="companion-check"><input type="checkbox" data-target="in_ai" checked> <span><code>in_ai</code></span></label><label class="companion-check"><input type="checkbox" data-target="lola"> <span><code>lola</code></span></label></div><label><span>User-selected summary/instructions</span><textarea data-companion-summary rows="4" placeholder="Describe the authorized task, exact goal, and any constraints."></textarea></label><label><span>User-selected text/excerpts</span><textarea data-companion-text rows="6" placeholder="Paste only the text you want to share. Files are not auto-attached."></textarea></label><div class="companion-grid"><button class="studio-primary" data-companion-export-json>Export JSON</button><button class="studio-tool" data-companion-export-md>Export Markdown</button></div><label><span>Import target</span><select data-companion-import-target></select></label><button class="studio-tool" data-companion-import>Import result JSON</button><section data-companion-preview></section><section data-companion-history></section></div></section>';
    document.body.appendChild(shell);
    shell.querySelectorAll('[data-companion-close]').forEach(btn=>btn.onclick=close);
    shell.querySelector('[data-companion-export-json]').onclick=()=>handleExport('json');
    shell.querySelector('[data-companion-export-md]').onclick=()=>handleExport('markdown');
    shell.querySelector('[data-companion-import]').onclick=importFromPicker;
    return shell;
  }
  function formData(){
    const host=ensureShell();
    const metadata={};
    host?.querySelectorAll('[data-meta]').forEach(box=>{if(box.checked)metadata[box.dataset.meta]=true});
    const t=[];
    host?.querySelectorAll('[data-target]').forEach(box=>{if(box.checked)t.push(box.dataset.target)});
    return{
      taskKind:host?.querySelector('[data-companion-task]')?.value||'development',
      title:host?.querySelector('[data-companion-title]')?.value||'',
      summary:host?.querySelector('[data-companion-summary]')?.value||'',
      selectedText:host?.querySelector('[data-companion-text]')?.value||'',
      projectId:host?.querySelector('[data-companion-project]')?.value||'',
      targets:t,
      metadata
    };
  }
  function syncForm(){
    const state=loadState(),host=ensureShell();
    if(!host)return;
    host.querySelector('[data-companion-task]').value=taskKind(state.draft.taskKind);
    host.querySelector('[data-companion-title]').value=state.draft.title||'';
    host.querySelector('[data-companion-summary]').value=state.draft.summary||'';
    host.querySelector('[data-companion-text]').value=state.draft.selectedText||'';
    host.querySelector('[data-companion-project]').innerHTML=projectOptions(state.draft.projectId||'');
    host.querySelector('[data-companion-import-target]').innerHTML=importOptions('');
    host.querySelectorAll('[data-meta]').forEach(box=>box.checked=!!state.draft.metadata?.[box.dataset.meta]);
    host.querySelectorAll('[data-target]').forEach(box=>box.checked=(state.draft.targets||['in_ai']).includes(box.dataset.target));
    renderState();
  }
  function renderState(){
    const state=loadState(),host=ensureShell();
    if(!host)return;
    const preview=host.querySelector('[data-companion-preview]');
    const history=host.querySelector('[data-companion-history]');
    preview.innerHTML=(state.latestManifest?'<div class="companion-note"><b>Last handoff</b><pre>'+esc(JSON.stringify(state.latestManifest,null,2))+'</pre></div>':'')+(state.latestResult?renderResultHTML(state.latestResult):'');
    history.innerHTML='<div class="companion-history"><div><b>Recent exports</b>'+(state.exports.length?'<ul>'+state.exports.map(item=>'<li>'+esc(item.createdAt)+' · '+esc(item.title)+' · '+esc(item.taskKind)+' · '+esc(item.targets.join(', '))+'</li>').join('')+'</ul>':'<p>No manifests exported yet.</p>')+'</div><div><b>Recent imports</b>'+(state.imports.length?'<ul>'+state.imports.map(item=>'<li>'+esc(item.createdAt)+' · '+esc(item.title)+' · '+esc(item.source)+' · '+esc(modeBadge(item).label)+'</li>').join('')+'</ul>':'<p>No companion results imported yet.</p>')+'</div></div>';
  }
  function handleExport(format){
    const data=formData();
    const manifest=downloadManifest(format,data);
    globalThis.MSAHelper?.success?.((format==='json'?'JSON':'Markdown')+' handoff exported for '+manifest.targets.join(' + ')+'.');
    renderState();
  }
  async function importFromPicker(){
    const input=document.createElement('input');
    input.type='file';
    input.accept='application/json,.json';
    input.hidden=true;
    input.onchange=async()=>{
      const file=input.files?.[0];
      if(!file){input.remove();return}
      try{
        if(file.size>IMPORT_MAX_BYTES)throw new Error('Companion result exceeds the safe import size');
        const raw=await file.text();
        const imported=importResultPayload(raw,{targetProjectId:ensureShell()?.querySelector('[data-companion-import-target]')?.value||''});
        globalThis.MSAHelper?.success?.('Companion result imported into '+(imported.importedTo==='project'?'the selected project':'the local evidence area')+'.');
        renderState();
      }catch(e){
        globalThis.MSAHelper?.error?.('Companion result could not be imported: '+e.message);
      }finally{input.remove()}
    };
    input.oncancel=()=>input.remove();
    document.body.appendChild(input);
    input.click();
  }
  function open(prefill={}){
    const host=ensureShell();
    if(!host)return;
    const state=saveState({...loadState(),draft:{...loadState().draft,...prefill}});
    host.classList.add('on');
    syncForm();
    host.querySelector('[data-companion-task]').value=taskKind(state.draft.taskKind);
  }
  function close(){ensureShell()?.classList.remove('on')}

  globalThis.MSACompanion={KEY,SCHEMA_VERSION,TASK_KINDS,RESULT_MODES,createManifest,manifestToMarkdown,downloadManifest,validateResultPayload,renderResultHTML,importResultPayload,loadState,saveState,open,close};
})();
