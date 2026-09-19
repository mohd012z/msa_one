(()=>{'use strict';
  const APPROVED='APPROVED',CHANGES_REQUIRED='CHANGES_REQUIRED',BLOCKED='BLOCKED';
  const MAX_IMPORT_SIZE=50*1024*1024;
  const EXTENSIONS=new Set(['docx','xlsx','pptx','pdf','csv','tsv','txt','rtf','html','htm','json','png','jpg','jpeg','webp']);

  function extension(name=''){return (String(name).split('.').pop()||'').toLowerCase()}
  function safeImport(file){
    const size=Number(file?.size)||0,ext=extension(file?.name);
    if(size>MAX_IMPORT_SIZE)return{status:BLOCKED,reason:'size',size,max:MAX_IMPORT_SIZE};
    if(!EXTENSIONS.has(ext))return{status:BLOCKED,reason:'type',extension:ext||'unknown'};
    return{status:APPROVED,extension:ext,size};
  }
  function visible(el){
    try{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden'}catch{return false}
  }
  function touchTargetCheck(root=document){
    const findings=[];
    root.querySelectorAll?.('button,a,input,select,textarea,[role="button"]').forEach(el=>{
      if(!visible(el))return;
      const r=el.getBoundingClientRect();
      if(r.width<44||r.height<44)findings.push({type:'touch-target',tag:el.tagName,width:Math.round(r.width),height:Math.round(r.height),min:44});
    });
    return findings;
  }
  function accessibilityCheck(root=document){
    const findings=[...touchTargetCheck(root)],warnings=[];
    root.querySelectorAll?.('button').forEach(el=>{
      if(!visible(el))return;
      const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
      if(!text&&!el.getAttribute('aria-label'))findings.push({type:'aria-label',tag:'BUTTON'});
    });
    if(!root.querySelector?.('[aria-live]'))warnings.push('No aria-live status region detected');
    return{status:findings.length?CHANGES_REQUIRED:APPROVED,findings,warnings};
  }
  function viewportCheck(){
    const meta=document.querySelector?.('meta[name="viewport"]');
    const vv=globalThis.visualViewport;
    const content=meta?.content||'';
    const findings=[];
    if(!/width=device-width/i.test(content))findings.push('viewport-width');
    if(!/viewport-fit=cover/i.test(content))findings.push('viewport-fit');
    return{
      status:findings.length?CHANGES_REQUIRED:APPROVED,
      findings,
      viewport:content,
      visualViewport:vv?{width:Math.round(vv.width),height:Math.round(vv.height),scale:vv.scale}:null,
      orientation:(globalThis.innerWidth||0)>=(globalThis.innerHeight||0)?'landscape':'portrait'
    };
  }
  function storageCheck(){
    const findings=[];
    if(typeof indexedDB==='undefined')findings.push('IndexedDB unavailable');
    if(typeof localStorage==='undefined')findings.push('localStorage unavailable');
    const recovery=globalThis.MSAProjects;
    if(!recovery?.recover||!recovery?.flush||!recovery?.validateRaw)findings.push('project recovery contract unavailable');
    return{
      status:findings.length?CHANGES_REQUIRED:APPROVED,
      findings,
      capabilities:{
        indexedDB:typeof indexedDB!=='undefined',
        localStorage:typeof localStorage!=='undefined',
        projectRecovery:!!(recovery?.recover&&recovery?.flush&&recovery?.validateRaw),
        backup:!!globalThis.MSAStorage?.downloadBackup
      }
    };
  }
  function securityCheck(){
    const csp=document.querySelector?.('meta[http-equiv="Content-Security-Policy"]')?.content||'';
    const findings=[];
    if(!csp.includes("object-src 'none'"))findings.push('CSP object-src');
    if(!csp.includes("base-uri 'none'"))findings.push('CSP base-uri');
    return{
      status:findings.length?CHANGES_REQUIRED:APPROVED,
      findings,
      centralSecurity:!!globalThis.MSASecurity,
      cleartextBlocked:csp.length>0
    };
  }
  function diagnostics(){
    const accessibility=accessibilityCheck(),viewport=viewportCheck(),storage=storageCheck(),security=securityCheck();
    const sections={accessibility,viewport,storage,security};
    const problem=Object.values(sections).some(x=>x.status!==APPROVED);
    return{
      status:problem?CHANGES_REQUIRED:APPROVED,
      build:globalThis.MSAAppManifest?.buildId||'unknown',
      version:globalThis.MSAAppManifest?.version||'unknown',
      sections,
      modules:{
        files:!!globalThis.MSAFiles,
        studio:!!globalThis.MSAStudio,
        storage:!!globalThis.MSAStorage,
        security:!!globalThis.MSASecurity,
        nativeFiles:!!globalThis.MSANativeFiles
      }
    };
  }
  function summary(){
    const d=diagnostics(),issues=Object.values(d.sections).reduce((n,s)=>n+(s.findings?.length||0),0);
    return d.status+' · '+issues+' finding'+(issues===1?'':'s')+' · '+d.build;
  }

  globalThis.MSAMobileQuality={APPROVED,CHANGES_REQUIRED,BLOCKED,MAX_IMPORT_SIZE,safeImport,touchTargetCheck,accessibilityCheck,viewportCheck,storageCheck,securityCheck,diagnostics,summary};
})();