(()=>{'use strict';
const AVAILABLE='AVAILABLE',DEGRADED='DEGRADED',UNAVAILABLE='UNAVAILABLE';
const modules=()=>({files:window.MSAFilesWorkspace,studio:window.MSAStudio,smartHTML:window.MSASmartHTML,raga:window.MSARagaConverter,anwar:window.MSAAnwarLens,celeb:window.MSACelebPlanner,kaga:window.MSAKagaLibrary,router:window.MSAAgentRouter});
function route(page='home'){let id=['home','files','create','ai','me'].includes(page)?page:'home';if(typeof window.show==='function')window.show(id);else{document.querySelectorAll?.('.page').forEach(x=>x.classList.remove('on'));document.getElementById?.(id)?.classList.add('on')}return id}
function openFiles(){route('files');window.MSAFiles?.renderFiles?.();return modules().files?AVAILABLE:DEGRADED}
function openCreate(type){route('create');if(type&&modules().studio?.open)return modules().studio.open(type);return modules().studio?AVAILABLE:DEGRADED}
function openAI(){route('ai');return modules().anwar?AVAILABLE:DEGRADED}
function openMe(){route('me');return AVAILABLE}
function openProject(id,type){let p=window.MSAProjectStore?.get?.(id);if(!p)return{status:UNAVAILABLE,error:'PROJECT_NOT_FOUND'};route('create');if(modules().studio?.open)return modules().studio.open(type||p.type,p.id);return{status:DEGRADED,project:p}}
function importToWorkspace(files,projectId){if(!modules().files?.importFiles)return{status:UNAVAILABLE,errors:['MSAFilesWorkspace']};let result=modules().files.importFiles(files,projectId);return{status:AVAILABLE,files:result}}
function handoff(agent='anwar',action='answer',payload={}){let router=modules().router;if(!router)return{status:UNAVAILABLE,errors:['MSAAgentRouter']};let auth=router.authorize?.(agent,action);if(auth?.status==='DENIED')return auth;if(agent==='raga'&&modules().raga)return{status:AVAILABLE,agent,action,payload};if(agent==='anwar'&&modules().anwar)return{status:AVAILABLE,agent,action,payload};if(agent==='celeb'&&modules().celeb)return{status:AVAILABLE,agent,action,payload};if(agent==='kaga'&&modules().kaga)return{status:AVAILABLE,agent,action,payload};return{status:DEGRADED,agent,action,payload}}
function healthCheck(){let m=modules(),capabilities=Object.fromEntries(Object.entries(m).map(([k,v])=>[k,!!v])),errors=Object.entries(capabilities).filter(([,v])=>!v).map(([k])=>k),status=errors.length===0?AVAILABLE:errors.length<Object.keys(capabilities).length?DEGRADED:UNAVAILABLE;return{status,capabilities,errors}}
function boot(){let h=healthCheck(),name=h.status===UNAVAILABLE?'msa:runtime-error':'msa:runtime-ready';try{window.dispatchEvent(new CustomEvent(name,{detail:h}))}catch{}return h}
window.MSARuntimeIntegration={AVAILABLE,DEGRADED,UNAVAILABLE,boot,route,openFiles,openCreate,openAI,openMe,openProject,importToWorkspace,handoff,healthCheck};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();