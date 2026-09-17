(()=>{
const KEY='msaOneProjectsV1',BACKUP='msaOneProjectsBackupV1',LAST_GOOD='msaOneProjectsLastGoodV1',DB_NAME='MSA_ONE_DB',DB_STORE='projects',MAX=80,MAX_TEXT=2000000;
function parse(raw){try{return JSON.parse(raw)}catch{return null}}
function validateProject(p){if(!p||typeof p!=='object'||Array.isArray(p)||typeof p.id!=='string'||!p.id.trim()||typeof p.type!=='string'||!p.type.trim())throw new Error('Invalid project');const q={...p,id:p.id.trim().slice(0,160),type:p.type.trim().slice(0,80)};if('title'in q)q.title=String(q.title??'').slice(0,500);for(const k of Object.keys(q)){if(typeof q[k]==='string'&&q[k].length>MAX_TEXT)q[k]=q[k].slice(0,MAX_TEXT)}return q}
function normalizeProjects(items){if(!Array.isArray(items))throw new Error('Invalid MSA One backup');const seen=new Set();return items.slice(0,MAX).map(p=>{const q=validateProject(p);if(seen.has(q.id))throw new Error('Duplicate project id');seen.add(q.id);return q})}
function readLegacy(){const a=parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(a))return[];try{return normalizeProjects(a)}catch{return[]}}
function recoverBackup(){for(const key of [LAST_GOOD,BACKUP]){const data=parse(localStorage.getItem(key)||'');const items=Array.isArray(data)?data:data?.projects;if(!Array.isArray(items))continue;try{return normalizeProjects(items)}catch{}}return[]}
let cache=readLegacy();if(!cache.length)cache=recoverBackup();
function notify(){try{window.dispatchEvent(new CustomEvent('msa:projects-changed'))}catch{}}
function lastKnownGood(items=cache){try{localStorage.setItem(LAST_GOOD,JSON.stringify({version:2,saved:Date.now(),projects:items}))}catch{}}
function mirror(a){cache=a.slice(0,MAX);try{localStorage.setItem(KEY,JSON.stringify(cache));localStorage.setItem(BACKUP,JSON.stringify({version:2,saved:Date.now(),projects:cache}));lastKnownGood(cache)}catch{}notify();return cache}
function openDb(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return resolve(null);const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE,{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function putAll(items){const db=await openDb().catch(()=>null);if(!db)return;await new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite'),s=tx.objectStore(DB_STORE);s.clear();items.forEach(p=>s.put(p));tx.oncomplete=()=>{try{db.close()}catch{}resolve()};tx.onerror=()=>{try{db.close()}catch{}reject(tx.error)}})}
async function readDb(){const db=await openDb().catch(()=>null);if(!db)return[];return new Promise(resolve=>{const tx=db.transaction(DB_STORE,'readonly'),r=tx.objectStore(DB_STORE).getAll();r.onsuccess=()=>{let out=[];try{out=normalizeProjects(r.result||[]).sort((a,b)=>(b.updated||0)-(a.updated||0))}catch{}try{db.close()}catch{}resolve(out)};r.onerror=()=>{try{db.close()}catch{}resolve([])}})}
async function migrateLegacy(){const dbItems=await readDb();if(dbItems.length){mirror(dbItems);return dbItems}let legacy=readLegacy();if(!legacy.length)legacy=recoverBackup();if(legacy.length)await putAll(legacy).catch(()=>{});mirror(legacy);return legacy}
function list(){return cache.slice()}
function get(id){return cache.find(x=>x.id===id)||null}
function persist(a){const safe=normalizeProjects(a);mirror(safe);putAll(cache).catch(()=>{});return cache}
function save(p){const a=list(),now=Date.now(),v=validateProject({...p,id:p.id||'p_'+now.toString(36),type:p.type||'document',created:p.created||now,updated:now});const i=a.findIndex(x=>x.id===v.id);i<0?a.unshift(v):a.splice(i,1,v);persist(a);return v}
function remove(id){persist(list().filter(x=>x.id!==id))}
function rename(id,title){const p=get(id);return p?save({...p,title:String(title||'').trim()||p.title}):null}
function duplicate(id){const p=get(id);if(!p)return null;return save({...p,id:null,title:(p.title||'Untitled')+' Copy',created:null})}
function backup(){const data={app:'MSA One',schema:2,exported:Date.now(),projects:list()};return JSON.stringify(data,null,2)}
async function restore(input){const data=typeof input==='string'?JSON.parse(input):input,items=normalizeProjects(Array.isArray(data)?data:data?.projects);lastKnownGood(cache);mirror(items);await putAll(items).catch(()=>{});return items.length}
function flush(){try{localStorage.setItem(KEY,JSON.stringify(cache));localStorage.setItem(BACKUP,JSON.stringify({version:2,saved:Date.now(),projects:cache}));lastKnownGood(cache)}catch{}putAll(cache).catch(()=>{})}
window.MSAProjectStore={KEY,BACKUP,LAST_GOOD,DB_NAME,list,get,save,remove,rename,duplicate,backup,restore,flush,migrateLegacy,recoverBackup,validateProject,normalizeProjects,lastKnownGood,ready:migrateLegacy()};
window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
})();