(()=>{'use strict';
  const TEXT_READY='TEXT_READY',SCANNED='SCANNED',PARTIAL='PARTIAL',UNKNOWN='UNKNOWN';
  const KEY='msaPdfReadinessV1';
  let state={projectId:null,title:'',pageCount:0,pages:{},updatedAt:null};

  function clone(v){return JSON.parse(JSON.stringify(v))}
  function load(){
    try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v==='object')state={...state,...v,pages:v.pages||{}}}catch{}
    return clone(state);
  }
  function save(){
    state.updatedAt=new Date().toISOString();
    try{localStorage.setItem(KEY,JSON.stringify(state));globalThis.MSAStorage?.mirror?.(KEY,JSON.stringify(state))}catch{}
    return clone(state);
  }
  function openProject(project={}){
    const id=String(project.id||project.projectId||'').trim();
    if(!id)return clone(state);
    const previous=load();
    if(previous.projectId===id){state={...previous,title:String(project.title||previous.title||'PDF')};return save()}
    state={projectId:id,title:String(project.title||'PDF'),pageCount:Number(project.pageCount)||0,pages:{},updatedAt:null};
    return save();
  }
  function setPageCount(count){
    state.pageCount=Math.max(0,Math.floor(Number(count)||0));
    return save();
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
    const p=Math.max(1,Math.floor(Number(page)||1));
    state.pages[p]={status:detect(info),textCoverage:Number(info.textCoverage)||0,checkedAt:new Date().toISOString()};
    if(p>state.pageCount)state.pageCount=p;
    save();return clone(state.pages[p]);
  }
  function pageStatus(page){return state.pages[Math.max(1,Math.floor(Number(page)||1))]?.status||UNKNOWN}
  function documentStatus(){
    const pages=Object.values(state.pages);
    if(!pages.length)return UNKNOWN;
    const statuses=pages.map(x=>x.status);
    if(statuses.every(x=>x===TEXT_READY))return TEXT_READY;
    if(statuses.every(x=>x===SCANNED))return SCANNED;
    if(statuses.some(x=>x===SCANNED||x===PARTIAL)&&statuses.some(x=>x===TEXT_READY))return PARTIAL;
    if(statuses.some(x=>x===PARTIAL))return PARTIAL;
    return UNKNOWN;
  }
  function needsOCR(){
    const status=documentStatus();
    return status===SCANNED||status===PARTIAL;
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
  function summary(){
    const counts={[TEXT_READY]:0,[SCANNED]:0,[PARTIAL]:0,[UNKNOWN]:0};
    for(let p=1;p<=state.pageCount;p++)counts[pageStatus(p)]++;
    return{...clone(state),documentStatus:documentStatus(),needsOCR:needsOCR(),counts,capabilities:capabilities()};
  }
  load();
  globalThis.MSAPDFReadiness={TEXT_READY,SCANNED,PARTIAL,UNKNOWN,openProject,setPageCount,detect,setPageReadiness,pageStatus,documentStatus,needsOCR,capabilities,summary,load,save};
})();