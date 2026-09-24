(()=>{
  const CONTRACT_VERSION='1.0';
  const TASK_TYPES=new Set(['coding','office','apk-creator','development','deep-dive','security-scan']);
  const WORKFLOWS={
    'local-template':{target:'myai',label:'Local template'},
    'model-assisted':{target:'myai',label:'Model-assisted'},
    'desktop-lola':{target:'lola',label:'Desktop Lola'}
  };
  const PROVIDER_LABELS={
    'local-template':'Local template',
    myai:'Model-assisted',
    lola:'Desktop Lola',
    unsupported:'Unsupported'
  };
  const STATUS_LABELS={completed:'Completed',failed:'Failed',partial:'Partial',unsupported:'Unsupported'};
  const LIMITS={
    requestChars:4000,
    projectNameChars:160,
    selectedFiles:12,
    selectedFileNameChars:120,
    selectedFileTypeChars:40,
    optionChars:1600,
    optionKeys:12,
    resultBytes:768*1024,
    resultSummaryChars:4000,
    sectionChars:12000,
    sections:16,
    findings:40,
    artifacts:20,
    warnings:20,
    labelChars:120,
    provenanceChars:120,
    storedImports:20,
    renderEntries:6
  };
  let preferredProjectId='';

  function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function text(value,max,label='Value'){
    const out=String(value??'').trim();
    if(!out)throw new Error(label+' is required');
    if(out.length>max)throw new Error(label+' is too large');
    return out;
  }
  function maybeText(value,max,label='Value'){
    if(value==null||value==='')return'';
    const out=String(value).trim();
    if(out.length>max)throw new Error(label+' is too large');
    return out;
  }
  function toJSON(value){return JSON.stringify(value)}
  function jsonSize(value){return new TextEncoder().encode(toJSON(value)).length}
  function iso(value,label='Timestamp'){
    const out=String(value||'').trim();
    if(!out||Number.isNaN(Date.parse(out)))throw new Error(label+' is invalid');
    return new Date(out).toISOString();
  }
  function safeId(value,label='ID'){
    const out=text(value,120,label);
    if(!/^[A-Za-z0-9._:-]+$/.test(out))throw new Error(label+' contains unsupported characters');
    return out;
  }
  function looksPathLike(value=''){return /(^[A-Za-z]:[\\/])|(^\\\\)|(^\/)|(^~\/)|(\.\.)|[\\/]/.test(String(value||'').trim())}
  function safeName(value,label='Name',max=LIMITS.labelChars){
    const out=text(value,max,label);
    if(looksPathLike(out))throw new Error(label+' must not look like a file path');
    return out;
  }
  function localName(value,label='Name',max=LIMITS.labelChars){
    return text(value,max,label).replace(/[\\/]+/g,' - ').replace(/\.\.+/g,'.').trim();
  }
  function enumValue(value,allowed,label){
    const out=String(value||'').trim();
    if(!allowed.has(out))throw new Error(label+' is invalid');
    return out;
  }
  function boundedArray(value,max,label){
    const out=Array.isArray(value)?value:[];
    if(out.length>max)throw new Error(label+' contains too many items');
    return out;
  }
  function sortProjects(){
    const items=globalThis.MSAProjects?.all?.()||[];
    return [...items].sort((a,b)=>(b.updated||0)-(a.updated||0));
  }
  function projectById(id){return sortProjects().find(project=>project.id===id)||null}
  function selectedFilesFromProject(project){
    if(!project)return[];
    const raw=typeof project.content==='string'?project.content:toJSON(project.content||'');
    return [{
      projectId:safeId(String(project.id||'project').slice(0,120),'Selected file project ID'),
      name:localName((project.title||'Untitled').slice(0,LIMITS.selectedFileNameChars),'Selected file name',LIMITS.selectedFileNameChars),
      type:maybeText(project.type||'unknown',LIMITS.selectedFileTypeChars,'Selected file type')||'unknown',
      sizeBytes:Math.max(0,new TextEncoder().encode(String(raw||'')).length)
    }];
  }
  function normalizeProjectMeta(project){
    if(!project||typeof project!=='object')throw new Error('Select a local MSA project before exporting or importing companion data');
    return {
      id:safeId(project.id||'project','Project ID'),
      name:text(project.title||'Untitled',LIMITS.projectNameChars,'Project name'),
      type:maybeText(project.type||'unknown',40,'Project type')||'unknown',
      updatedAt:new Date(Number(project.updated)||Date.now()).toISOString(),
      companionImports:projectImports(project).length
    };
  }
  function normalizeSelectedFile(file){
    if(!file||typeof file!=='object'||Array.isArray(file))throw new Error('Selected file metadata is invalid');
    return {
      projectId:maybeText(file.projectId||'',120,'Selected file project ID'),
      name:safeName(file.name||'Selected file','Selected file name',LIMITS.selectedFileNameChars),
      type:maybeText(file.type||'unknown',LIMITS.selectedFileTypeChars,'Selected file type')||'unknown',
      sizeBytes:Math.max(0,Math.min(24*1024*1024,Number(file.sizeBytes)||0))
    };
  }
  function normalizeOptions(options={}){
    if(!options||typeof options!=='object'||Array.isArray(options))throw new Error('Options are invalid');
    const entries=Object.entries(options).slice(0,LIMITS.optionKeys).map(([key,value])=>{
      const safeKey=text(key,40,'Option key');
      let safeValue=value;
      if(Array.isArray(value))safeValue=value.slice(0,12).map(item=>maybeText(item,120,'Option value'));
      else if(typeof value==='string')safeValue=maybeText(value,240,'Option value');
      else if(typeof value==='number')safeValue=Number.isFinite(value)?value:0;
      else if(typeof value==='boolean')safeValue=value;
      else safeValue=maybeText(toJSON(value),240,'Option value');
      return [safeKey,safeValue];
    });
    const normalized=Object.fromEntries(entries);
    if(jsonSize(normalized)>LIMITS.optionChars)throw new Error('Options are too large');
    return normalized;
  }
  function normalizeAuthorization(value){
    if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Authorization is required');
    if(value.confirmed!==true)throw new Error('Authorization confirmation is required');
    return {
      confirmed:true,
      scope:text(value.scope||'user-owned-or-authorized-project',120,'Authorization scope')
    };
  }
  function createManifest(input={}){
    const workflow=enumValue(input.workflow||'model-assisted',new Set(Object.keys(WORKFLOWS)),'Workflow');
    const taskType=enumValue(input.taskType,TASK_TYPES,'Task type');
    const project=normalizeProjectMeta(input.project);
    const selectedFiles=boundedArray(input.selectedFiles?.length?input.selectedFiles:selectedFilesFromProject(input.project),LIMITS.selectedFiles,'Selected files').map(normalizeSelectedFile);
    return {
      contractVersion:CONTRACT_VERSION,
      jobId:safeId(input.jobId||globalThis.MSACore?.uid?.('job')||('job_'+Date.now().toString(36)),'Job ID'),
      source:text(input.source||'msa-one',40,'Source'),
      target:text(input.target||WORKFLOWS[workflow].target,40,'Target'),
      taskType,
      request:text(input.request,LIMITS.requestChars,'Request'),
      project,
      selectedFiles,
      options:normalizeOptions(input.options||{workflow,offline:true,manualHandoff:true,workflowLabel:WORKFLOWS[workflow].label}),
      authorization:normalizeAuthorization(input.authorization),
      createdAt:iso(input.createdAt||new Date().toISOString(),'Created timestamp')
    };
  }
  function validateManifest(input){return createManifest(input)}
  function manifestToJSON(manifest){return JSON.stringify(validateManifest(manifest),null,2)}
  function manifestToMarkdown(manifest){
    const safe=validateManifest(manifest);
    return [
      '# MSA One companion handoff',
      '',
      '> Offline local handoff only. Save this file locally and move it manually to MyAI or desktop Lola.',
      '',
      '## Contract',
      '- contractVersion: `'+safe.contractVersion+'`',
      '- jobId: `'+safe.jobId+'`',
      '- source: `'+safe.source+'`',
      '- target: `'+safe.target+'`',
      '- taskType: `'+safe.taskType+'`',
      '- createdAt: `'+safe.createdAt+'`',
      '',
      '## Request',
      safe.request,
      '',
      '## Project metadata',
      '```json',
      JSON.stringify(safe.project,null,2),
      '```',
      '',
      '## Selected files metadata only',
      '```json',
      JSON.stringify(safe.selectedFiles,null,2),
      '```',
      '',
      '## Options',
      '```json',
      JSON.stringify(safe.options,null,2),
      '```',
      '',
      '## Authorization',
      '```json',
      JSON.stringify(safe.authorization,null,2),
      '```',
      '',
      '## Manual workflow',
      '1. Keep all local files on this device unless you manually choose to move the exported handoff.',
      '2. Desktop Lola runs outside Android; MSA One only exports/imports local JSON or Markdown files.',
      '3. Import only a trusted result JSON that matches the same `jobId` and Release 1 contract.'
    ].join('\n');
  }
  function normalizeSection(section){
    if(!section||typeof section!=='object'||Array.isArray(section))throw new Error('Result section is invalid');
    return {
      title:text(section.title||'Section',LIMITS.labelChars,'Result section title'),
      format:enumValue(section.format||'text',new Set(['text','markdown','json']),'Result section format'),
      content:text(section.content,LIMITS.sectionChars,'Result section content')
    };
  }
  function normalizeFinding(finding){
    if(!finding||typeof finding!=='object'||Array.isArray(finding))throw new Error('Result finding is invalid');
    return {
      title:text(finding.title||'Finding',LIMITS.labelChars,'Finding title'),
      severity:enumValue(finding.severity||'info',new Set(['info','low','medium','high','critical']),'Finding severity'),
      details:text(finding.details||finding.summary||'',1600,'Finding details')
    };
  }
  function normalizeArtifact(artifact){
    if(!artifact||typeof artifact!=='object'||Array.isArray(artifact))throw new Error('Result artifact is invalid');
    for(const key of Object.keys(artifact))if(/path|uri|folder|directory|filename/i.test(key))throw new Error('Result artifact path-like fields are not allowed');
    return {
      label:safeName(artifact.label||'Artifact','Artifact label',LIMITS.labelChars),
      type:text(artifact.type||'text',40,'Artifact type'),
      value:(()=>{const value=maybeText(artifact.value??artifact.content??'',1600,'Artifact value');if(value&&looksPathLike(value))throw new Error('Result artifact path-like values are not allowed');return value})(),
      digest:maybeText(artifact.digest||'',120,'Artifact digest'),
      sizeBytes:Math.max(0,Math.min(24*1024*1024,Number(artifact.sizeBytes)||0))
    };
  }
  function normalizeProvenance(provenance){
    if(!provenance||typeof provenance!=='object'||Array.isArray(provenance))throw new Error('Result provenance is invalid');
    return {
      tool:text(provenance.tool||'unknown',LIMITS.provenanceChars,'Provenance tool'),
      toolVersion:maybeText(provenance.toolVersion||'',LIMITS.provenanceChars,'Provenance tool version'),
      createdAt:iso(provenance.createdAt||new Date().toISOString(),'Provenance timestamp')
    };
  }
  function validateResult(input){
    if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Result JSON is invalid');
    const result={
      contractVersion:text(input.contractVersion||'',16,'Contract version'),
      jobId:safeId(input.jobId||'','Job ID'),
      status:enumValue(input.status,new Set(['completed','failed','partial','unsupported']),'Result status'),
      provider:enumValue(input.provider,new Set(['local-template','myai','lola','unsupported']),'Result provider'),
      summary:text(input.summary,LIMITS.resultSummaryChars,'Result summary'),
      sections:boundedArray(input.sections,LIMITS.sections,'Result sections').map(normalizeSection),
      findings:boundedArray(input.findings||[],LIMITS.findings,'Result findings').map(normalizeFinding),
      artifacts:boundedArray(input.artifacts||[],LIMITS.artifacts,'Result artifacts').map(normalizeArtifact),
      warnings:boundedArray(input.warnings||[],LIMITS.warnings,'Result warnings').map((warning,index)=>text(warning,400,'Warning '+(index+1))),
      provenance:normalizeProvenance(input.provenance),
      createdAt:iso(input.createdAt||new Date().toISOString(),'Result timestamp')
    };
    if(result.contractVersion!==CONTRACT_VERSION)throw new Error('Unsupported companion contract version');
    if(jsonSize(result)>LIMITS.resultBytes)throw new Error('Result JSON is too large');
    return result;
  }
  function normalizeStoredImport(entry,{strict=true}={}){
    try{
      if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new Error('Stored companion import is invalid');
      const result=validateResult(entry.result||entry);
      return {jobId:result.jobId,importedAt:iso(entry.importedAt||result.createdAt,'Import timestamp'),result};
    }catch(error){if(strict)throw error;return null}
  }
  function sanitizeStoredProjectCompanion(value,{strict=true}={}){
    if(value==null)return undefined;
    try{
      if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Stored companion data is invalid');
      const seen=new Set(),imports=[];
      for(const entry of boundedArray(value.imports||[],LIMITS.storedImports,'Stored imports')){
        const safe=normalizeStoredImport(entry,{strict});
        if(!safe)continue;
        if(seen.has(safe.jobId)){
          if(strict)throw new Error('Duplicate companion job was found');
          continue;
        }
        seen.add(safe.jobId);
        imports.push(safe);
      }
      return {schema:CONTRACT_VERSION,updatedAt:iso(value.updatedAt||imports[0]?.importedAt||new Date().toISOString(),'Stored companion timestamp'),imports};
    }catch(error){if(strict)throw error;return undefined}
  }
  function projectImports(project){return sanitizeStoredProjectCompanion(project?.companion,{strict:false})?.imports||[]}
  function importResultIntoProject(projectId,rawText){
    const project=projectById(projectId);
    if(!project)throw new Error('Select a local MSA project before importing a companion result');
    const raw=text(rawText,LIMITS.resultBytes,'Result file');
    let parsed;
    try{parsed=JSON.parse(raw)}catch{throw new Error('Result JSON is invalid')}
    const result=validateResult(parsed);
    const existing=sanitizeStoredProjectCompanion(project.companion,{strict:false})||{schema:CONTRACT_VERSION,updatedAt:new Date().toISOString(),imports:[]};
    if(existing.imports.some(entry=>entry.jobId===result.jobId))throw new Error('This companion job was already imported for the selected project');
    const next={schema:CONTRACT_VERSION,updatedAt:new Date().toISOString(),imports:[{jobId:result.jobId,importedAt:new Date().toISOString(),result},...existing.imports].slice(0,LIMITS.storedImports)};
    globalThis.MSAProjects?.upsert?.({...project,updated:Date.now(),companion:next});
    preferredProjectId=project.id;
    return result;
  }
  function renderResult(result){
    const safe=validateResult(result);
    const sections=safe.sections.length?'<div class="ws-list">'+safe.sections.map(section=>'<article class="ws-row" style="display:block"><b>'+esc(section.title)+'</b><small>'+esc(section.format)+'</small><pre class="msa-companion-pre">'+esc(section.content)+'</pre></article>').join('')+'</div>':'';
    const findings=safe.findings.length?'<ul class="msa-companion-list">'+safe.findings.map(finding=>'<li><b>'+esc(finding.title)+'</b> · '+esc(finding.severity)+'<div>'+esc(finding.details)+'</div></li>').join('')+'</ul>':'';
    const artifacts=safe.artifacts.length?'<ul class="msa-companion-list">'+safe.artifacts.map(artifact=>'<li><b>'+esc(artifact.label)+'</b> · '+esc(artifact.type)+(artifact.value?'<div>'+esc(artifact.value)+'</div>':'')+'</li>').join('')+'</ul>':'';
    const warnings=safe.warnings.length?'<ul class="msa-companion-list">'+safe.warnings.map(warning=>'<li>'+esc(warning)+'</li>').join('')+'</ul>':'';
    return '<article class="msa-companion-result"><div class="msa-companion-head"><div><b>'+esc(PROVIDER_LABELS[safe.provider]||safe.provider)+'</b><small>'+esc(STATUS_LABELS[safe.status]||safe.status)+' · '+esc(safe.createdAt)+'</small></div><span class="ws-chip on">'+esc(PROVIDER_LABELS[safe.provider]||safe.provider)+'</span></div><p>'+esc(safe.summary)+'</p>'+sections+findings+artifacts+warnings+'<small class="muted">Provenance: '+esc(safe.provenance.tool)+(safe.provenance.toolVersion?' '+esc(safe.provenance.toolVersion):'')+' · '+esc(safe.provenance.createdAt)+'</small></article>';
  }
  function exportName(manifest,ext){return 'msa-one-'+manifest.target+'-'+manifest.jobId+'.'+ext}
  function downloadsFor(root,format){
    const section=root?.closest?.('[data-companion-panel]')||root;
    const project=projectById(section.querySelector('[data-companion-project]')?.value||'');
    const workflow=section.querySelector('[data-companion-workflow]')?.value||'model-assisted';
    const manifest=createManifest({
      workflow,
      taskType:section.querySelector('[data-companion-task]')?.value||'coding',
      request:section.querySelector('[data-companion-request]')?.value||'',
      project,
      selectedFiles:selectedFilesFromProject(project),
      options:{workflow,offline:true,manualHandoff:true,workflowLabel:WORKFLOWS[workflow]?.label||workflow,exportFormat:format},
      authorization:{confirmed:section.querySelector('[data-companion-authorized]')?.checked===true,scope:section.querySelector('[data-companion-scope]')?.value||'user-owned-or-authorized-project'}
    });
    const data=format==='markdown'?manifestToMarkdown(manifest):manifestToJSON(manifest);
    const mime=format==='markdown'?'text/markdown':'application/json';
    const name=exportName(manifest,format==='markdown'?'md':'json');
    if(globalThis.MSACore?.download)globalThis.MSACore.download(name,data,mime);
    return manifest;
  }
  function importPicker(section){
    const input=document.createElement('input');
    input.type='file';
    input.accept='application/json,.json';
    input.hidden=true;
    input.onchange=async()=>{
      const file=input.files?.[0];
      if(!file){input.remove();return}
      try{
        if(file.size>LIMITS.resultBytes)throw new Error('Result JSON is too large');
        importResultIntoProject(section.querySelector('[data-companion-project]')?.value||'',await file.text());
        globalThis.MSAHelper?.success?.('Companion result imported into the selected local project.');
        updatePanel(section);
      }catch(error){
        globalThis.MSAHelper?.error?.('Companion import could not be completed: '+error.message);
      }finally{input.remove()}
    };
    input.oncancel=()=>input.remove();
    document.body.appendChild(input);
    input.click();
  }
  function projectSummary(project){
    if(!project)return '<div class="ws-empty">Create or import a local project first. Companion handoffs stay offline and attach results to an existing local project.</div>';
    const files=selectedFilesFromProject(project);
    return '<div class="ws-list"><article class="ws-row"><span class="ws-row-icon">▣</span><span class="ws-row-meta"><b>'+esc(project.title||'Untitled')+'</b><small>'+esc(project.type||'project')+' · '+esc(files[0]?.sizeBytes||0)+' bytes of local metadata</small></span></article></div>';
  }
  function renderImports(project){
    if(!project)return '<div class="ws-empty">No local project selected.</div>';
    const imports=projectImports(project).slice(0,LIMITS.renderEntries);
    if(!imports.length)return '<div class="ws-empty">No imported MyAI/Lola results yet. Import a trusted Release 1 JSON result to keep evidence with this project.</div>';
    return imports.map(entry=>renderResult(entry.result)).join('');
  }
  function updatePanel(section){
    if(!section)return;
    const select=section.querySelector('[data-companion-project]');
    const projects=sortProjects();
    if(select&&!select.value&&projects[0])select.value=preferredProjectId&&projects.some(project=>project.id===preferredProjectId)?preferredProjectId:projects[0].id;
    const project=projectById(select?.value||preferredProjectId||'');
    if(project)preferredProjectId=project.id;
    const summary=section.querySelector('[data-companion-summary]');
    const results=section.querySelector('[data-companion-results]');
    if(summary)summary.innerHTML=projectSummary(project);
    if(results)results.innerHTML=renderImports(project);
  }
  function panelHTML(){
    const projects=sortProjects();
    const selected=preferredProjectId&&projects.some(project=>project.id===preferredProjectId)?preferredProjectId:(projects[0]?.id||'');
    const options=projects.map(project=>'<option value="'+esc(project.id)+'"'+(project.id===selected?' selected':'')+'>'+esc(project.title||'Untitled')+' · '+esc(project.type||'project')+'</option>').join('');
    return '<section class="ws-section" data-companion-panel><div class="ws-section-head"><h2>MyAI ↔ Lola companion</h2><small>Offline local handoff</small></div><p class="muted">Export a bounded Release 1 JSON or Markdown handoff, then manually move it to MyAI or desktop Lola. MSA One never uploads files automatically and desktop Lola stays outside Android.</p><div class="ws-chipbar"><span class="ws-chip on">Offline</span><span class="ws-chip">Local template</span><span class="ws-chip">Model-assisted</span><span class="ws-chip">Desktop Lola</span><span class="ws-chip">Unsupported</span></div><label class="muted" for="msa-companion-project">Local project</label><select id="msa-companion-project" class="lang" data-companion-project aria-label="Select local project"><option value="">Select a local project</option>'+options+'</select><div class="ws-grid" style="margin-top:10px"><label><small class="muted">Workflow</small><select class="lang" data-companion-workflow aria-label="Select companion workflow"><option value="local-template">Local template</option><option value="model-assisted" selected>Model-assisted</option><option value="desktop-lola">Desktop Lola</option></select></label><label><small class="muted">Task type</small><select class="lang" data-companion-task aria-label="Select companion task type"><option value="coding">coding</option><option value="office">office</option><option value="apk-creator">apk-creator</option><option value="development">development</option><option value="deep-dive">deep-dive</option><option value="security-scan">security-scan</option></select></label></div><label class="muted" for="msa-companion-request" style="display:block;margin-top:10px">Request</label><textarea id="msa-companion-request" data-companion-request placeholder="Describe the manual job you want MyAI or desktop Lola to perform. Only metadata is exported."></textarea><div class="ws-grid" style="margin-top:10px"><label><small class="muted">Authorization scope</small><select class="lang" data-companion-scope aria-label="Authorization scope"><option value="user-owned-or-authorized-project">user-owned-or-authorized-project</option><option value="local-project-with-explicit-permission">local-project-with-explicit-permission</option></select></label><label class="muted" style="display:flex;gap:8px;align-items:center;margin-top:20px"><input type="checkbox" data-companion-authorized> I confirm I own this project or I am authorized to use it.</label></div><div data-companion-summary style="margin-top:12px"></div><div class="chips" style="margin-top:10px"><button class="chip" data-companion-export-json>Export JSON</button><button class="chip" data-companion-export-markdown>Export Markdown</button><button class="chip" data-companion-import>Import Result</button></div><div class="ws-section-head" style="margin-top:16px"><h3 style="margin:0">Imported evidence</h3><small>Stored with the selected local project</small></div><div data-companion-results></div></section>';
  }
  function wireAIPage(root=document){
    const section=root.querySelector?.('[data-companion-panel]');
    if(!section||section.dataset.companionWired)return;
    section.dataset.companionWired='1';
    section.querySelector('[data-companion-project]')?.addEventListener('change',()=>updatePanel(section));
    section.querySelector('[data-companion-export-json]')?.addEventListener('click',()=>{
      try{const manifest=downloadsFor(section,'json');globalThis.MSAHelper?.success?.('Companion JSON exported for '+(WORKFLOWS[section.querySelector('[data-companion-workflow]')?.value||'model-assisted']?.label||manifest.target)+'.')}catch(error){globalThis.MSAHelper?.error?.('Companion export could not be completed: '+error.message)}
    });
    section.querySelector('[data-companion-export-markdown]')?.addEventListener('click',()=>{
      try{const manifest=downloadsFor(section,'markdown');globalThis.MSAHelper?.success?.('Companion Markdown exported for '+(WORKFLOWS[section.querySelector('[data-companion-workflow]')?.value||'model-assisted']?.label||manifest.target)+'.')}catch(error){globalThis.MSAHelper?.error?.('Companion export could not be completed: '+error.message)}
    });
    section.querySelector('[data-companion-import]')?.addEventListener('click',()=>importPicker(section));
    updatePanel(section);
  }
  function open(projectId=''){
    if(projectId)preferredProjectId=projectId;
    globalThis.MSAAppShell?.open?.('ai');
    setTimeout(()=>{
      const panel=document.querySelector('[data-companion-panel]');
      if(panel){
        if(projectId){const select=panel.querySelector('[data-companion-project]');if(select&&[...select.options].some(option=>option.value===projectId))select.value=projectId}
        updatePanel(panel);
        panel.scrollIntoView({behavior:'smooth',block:'start'});
      }
    },50);
  }

  globalThis.MSACompanion={
    CONTRACT_VERSION,
    LIMITS,
    TASK_TYPES:[...TASK_TYPES],
    WORKFLOWS,
    PROVIDER_LABELS,
    STATUS_LABELS,
    selectedFilesFromProject,
    createManifest,
    validateManifest,
    manifestToJSON,
    manifestToMarkdown,
    validateResult,
    sanitizeStoredProjectCompanion,
    importResultIntoProject,
    renderResult,
    panelHTML,
    wireAIPage,
    open,
    projectImports
  };
})();
