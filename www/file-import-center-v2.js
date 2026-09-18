(()=>{'use strict';
const AVAILABLE='AVAILABLE',PREVIEW='PREVIEW',LATER='LATER',UNAVAILABLE='UNAVAILABLE',KEY='msa:file-import-center:v2',MAX=50*1024*1024;
let state={status:'idle',progress:0,current:null,completed:0,rejected:0,duplicate:0,cancelled:false,importHistory:[]};
const ext=n=>(String(n||'').split('.').pop()||'').toLowerCase();
const kind=f=>{let e=ext(f.name),m=String(f.type||'');if(e==='pdf')return'pdf';if(e==='docx')return'docx';if(e==='xlsx')return'xlsx';if(e==='pptx')return'pptx';if(e==='csv')return'csv';if(e==='html'||e==='htm')return'html';if(e==='txt')return'txt';if(m.startsWith('image/'))return'image';return e||'unknown'};
const capability=t=>({pdf:PREVIEW,docx:LATER,xlsx:LATER,pptx:LATER,csv:AVAILABLE,html:AVAILABLE,txt:AVAILABLE,image:PREVIEW}[t]||UNAVAILABLE);
function validateFile(f){let t=kind(f),errors=[];if(!f?.name)errors.push('name');if(Number(f?.size||0)>MAX)errors.push('size');if(capability(t)===UNAVAILABLE)errors.push('type');return{valid:!errors.length,type:t,capability:capability(t),errors,size:f?.size||0,name:f?.name||''}}
const fingerprint=f=>[f.name,f.size,f.lastModified||0].join(':');
function detectDuplicate(f){let fp=fingerprint(f);return state.importHistory.some(x=>x.fingerprint===fp&&x.status==='completed')}
function persist(){try{localStorage.setItem(KEY,JSON.stringify({...state,current:null}))}catch{}}
function recover(){try{let x=JSON.parse(localStorage.getItem(KEY)||'null');if(x)state={...state,...x,status:x.status==='running'?'recovered':x.status,cancelled:false}}catch{}return getStatus()}
function routeFile(file,record){let t=record.type;
 if(t==='pdf'&&window.MSAPDFWorkspace?.open)return window.MSAPDFWorkspace.open(file);
 if(t==='html'&&window.MSASmartHTML?.importFile)return window.MSASmartHTML.importFile(file);
 if(['csv','html','txt'].includes(t)&&window.MSARagaConverter)return{target:'raga',type:t};
 if(['docx','xlsx','pptx'].includes(t))return{target:'raga',type:t,capability:LATER};
 if(window.MSADocumentIR&&t==='txt')return{target:'document',type:t};return{target:'files',type:t,capability:record.capability}}
function importOne(file){if(state.cancelled)return{status:'cancelled'};let v=validateFile(file),base={id:Date.now()+'-'+Math.random().toString(36).slice(2),fingerprint:fingerprint(file),name:v.name,size:v.size,lastModified:file.lastModified||0,type:v.type,capability:v.capability,at:new Date().toISOString()};
 if(!v.valid){state.rejected++;let r={...base,status:'rejected',errors:v.errors};state.importHistory.push(r);return r}
 if(detectDuplicate(file)){state.duplicate++;let r={...base,status:'duplicate'};state.importHistory.push(r);return r}
 let workspace=window.MSAFilesWorkspace?.importFiles?.([file]);let routed=routeFile(file,v);state.completed++;let r={...base,status:'completed',workspace:!!workspace,route:routed};state.importHistory.push(r);return r}
async function importFiles(files){let a=Array.from(files||[]);state.status='running';state.progress=0;state.cancelled=false;state.completed=state.rejected=state.duplicate=0;let results=[];
 for(let i=0;i<a.length;i++){if(state.cancelled)break;state.current=a[i].name;results.push(importOne(a[i]));state.progress=a.length?Math.round(((i+1)/a.length)*100):100;persist();await Promise.resolve()}
 state.current=null;state.status=state.cancelled?'cancelled':'completed';persist();return{status:state.status,progress:state.progress,results}}
async function importFolder(files){return importFiles(files)}
function cancelImport(){state.cancelled=true;state.status='cancelled';persist();return true}
function getStatus(){return JSON.parse(JSON.stringify(state))}
function clearHistory(){state.importHistory=[];persist()}
recover();
window.MSAFileImportCenter={AVAILABLE,PREVIEW,LATER,UNAVAILABLE,importFiles,importFolder,validateFile,detectDuplicate,routeFile,importHistory:()=>state.importHistory.slice(),recover,progress:()=>state.progress,cancelImport,getStatus,clearHistory,capability};
})();