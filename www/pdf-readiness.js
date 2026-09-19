(()=>{'use strict';
  const TEXT_READY='TEXT_READY',SCANNED='SCANNED',PARTIAL='PARTIAL',UNKNOWN='UNKNOWN';
  const KEY='msaPdfReadinessV1';
  let db={schema:1,activeId:null,projects:{}};

  function clone(v){return JSON.parse(JSON.stringify(v))}
  function load(){
    try{
      const value=JSON.parse(localStorage.getItem(KEY)||'null');
      if(value?.schema===1&&value.projects&&typeof value.projects==='object')db={schema:1,activeId:value.activeId||null,projects:value.projects};
    }catch{}
    return clone(db);
  }
  function persist(){
    try{
      const raw=JSON.stringify(db);
      localStorage.setItem(KEY,raw);
      globalThis.MSAStorage?.mirror?.(KEY,raw);
    }catch{}
    return clone(db);
  }
  function active(){return db.activeId?db.projects[db.activeId]||null:null}
  function ensure(project={}){
    const id=String(project.id||project.projectId||db.activeId||'').trim();
    if(!id)return null;
    if(!db.projects[id])db.projects[id]={projectId:id,title:String(project.title||'PDF'),pageCount:Math.max(0,Math.floor(Number(project.pageCount)||0)),pages:{},updatedAt:null};
    const rec=db.projects[id];
    if(project.title)rec.title=String(project.title);
    if(Number(project.pageCount)>0)rec.pageCount=Math.max(rec.pageCount,Math.floor(Number(project.pageCount)));
    db.activeId=id;
    return rec;
  }
  function touch(rec){if(rec)rec.updatedAt=new Date().toISOString();persist();return rec?clone(rec):null}
  function openProject(project={}){
    load();
    return touch(ensure(project));
  }
  function setPageCount(count){
    const rec=ensure();
    if(!rec)return null;
    rec.pageCount=Math.max(0,Math.floor(Number(count)||0));
    return touch(rec);
  }
  function detect(info={}){
    if(info.status&&[TEXT_READY,SCANNED,PARTIAL,UNKNOWN].includes(info.status))return info.status;
    const coverage=Math.max(0,Math.min(1,Number(info.textCoverage)||0));
    if(info.hasText===true&&coverage>=0.8)return TEXT_READY;
    if(info.scanned===true||info.hasText===false)return SCANNED;
    if(info.hasText===true||coverage>0)return PARTIAL;
    return UNKNOWN;
  }
  function setPageReadiness(page,info={}){
    const rec=ensure();
    if(!rec)return null;
    const p=Math.max(1,Math.floor(Number(page)||1));
    rec.pages[p]={status:detect(info),textCoverage:Math.max(0,Math.min(1,Number(info.textCoverage)||0)),checkedAt:new Date().toISOString()};
    if(p>rec.pageCount)rec.pageCount=p;
    touch(rec);return clone(rec.pages[p]);
  }
  function pageStatus(page,projectId=db.activeId){
    const rec=projectId?db.projects[projectId]:null;
    return rec?.pages?.[Math.max(1,Math.floor(Number(page)||1))]?.status||UNKNOWN;
  }
  function statuses(rec=active()){
    if(!rec)return[];
    const count=Math.max(rec.pageCount,Object.keys(rec.pages||{}).length);
    if(!count)return[];
    return Array.from({length:count},(_,i)=>pageStatus(i+1,rec.projectId));
  }
  function documentStatus(projectId=db.activeId){
    const rec=projectId?db.projects[projectId]:null,values=statuses(rec);
    if(!values.length)return UNKNOWN;
    if(values.every(x=>x===TEXT_READY))return TEXT_READY;
    if(values.every(x=>x===SCANNED))return SCANNED;
    const known=values.filter(x=>x!==UNKNOWN);
    if(!known.length)return UNKNOWN;
    return PARTIAL;
  }
  function needsOCR(projectId=db.activeId){
    const rec=projectId?db.projects[projectId]:null;
    if(!rec)return false;
    return statuses(rec).some(x=>x===SCANNED||x===PARTIAL);
  }
  function capabilities(){
    return{
      pdfViewer:!!globalThis.MSAStudio,
      pdfImport:!!globalThis.MSAImport,
      nativeFileBridge:!!globalThis.MSANativeFiles,
      readinessTracking:true,
      builtInOCR:false,
      searchableTextExtraction:false
    };
  }
  function summary(projectId=db.activeId){
    const rec=projectId?db.projects[projectId]:null;
    const counts={[TEXT_READY]:0,[SCANNED]:0,[PARTIAL]:0,[UNKNOWN]:0};
    if(rec)for(const status of statuses(rec))counts[status]++;
    return{
      project:rec?clone(rec):null,
      documentStatus:documentStatus(projectId),
      needsOCR:needsOCR(projectId),
      counts,
      capabilities:capabilities()
    };
  }
  function list(){return Object.values(db.projects).map(clone)}
  function remove(projectId){
    if(!projectId||!db.projects[projectId])return false;
    delete db.projects[projectId];
    if(db.activeId===projectId)db.activeId=Object.keys(db.projects)[0]||null;
    persist();return true;
  }

  load();
  globalThis.MSAPDFReadiness={TEXT_READY,SCANNED,PARTIAL,UNKNOWN,openProject,setPageCount,detect,setPageReadiness,pageStatus,documentStatus,needsOCR,capabilities,summary,list,remove,load,persist};
})();