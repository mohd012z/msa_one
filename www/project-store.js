(()=>{
const KEY='msaOneProjectsV1',BACKUP='msaOneProjectsBackupV1',DB_NAME='MSA_ONE_DB',DB_STORE='projects',MAX=80;
let cache=readLegacy();
function readLegacy(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch{return[]}}
function notify(){try{window.dispatchEvent(new CustomEvent('msa:projects-changed'))}catch{}}
function mirror(a){cache=a.slice(0,MAX);try{localStorage.setItem(KEY,JSON.stringify(cache));localStorage.setItem(BACKUP,JSON.stringify({version:1,saved:Date.now(),projects:cache}))}catch{}notify();return cache}
function openDb(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return resolve(null);const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE,{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function putAll(items){const db=await openDb().catch(()=>null);if(!db)return;await new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite'),s=tx.objectStore(DB_STORE);s.clear();items.forEach(p=>s.put(p));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function readDb(){const db=await openDb().catch(()=>null);if(!db)return[];return new Promise(resolve=>{const tx=db.transaction(DB_STORE,'readonly'),r=tx.objectStore(DB_STORE).getAll();r.onsuccess=()=>resolve((r.result||[]).sort((a,b)=>(b.updated||0)-(a.updated||0)));r.onerror=()=>resolve([])})}
async function migrateLegacy(){const dbItems=await readDb();if(dbItems.length){mirror(dbItems);return dbItems}const legacy=readLegacy();if(legacy.length)await putAll(legacy).catch(()=>{});mirror(legacy);return legacy}
function list(){return cache.slice()}
function get(id){return cache.find(x=>x.id===id)||null}
function persist(a){mirror(a);putAll(cache).catch(()=>{});return cache}
function save(p){const a=list(),now=Date.now(),v={...p,id:p.id||'p_'+now.toString(36),created:p.created||now,updated:now};const i=a.findIndex(x=>x.id===v.id);i<0?a.unshift(v):a.splice(i,1,v);persist(a);return v}
function remove(id){persist(list().filter(x=>x.id!==id))}
function rename(id,title){const p=get(id);return p?save({...p,title:String(title||'').trim()||p.title}):null}
function duplicate(id){const p=get(id);if(!p)return null;return save({...p,id:null,title:(p.title||'Untitled')+' Copy',created:null})}
function backup(){const data={app:'MSA One',schema:1,exported:Date.now(),projects:list()};return JSON.stringify(data,null,2)}
async function restore(input){let data=typeof input==='string'?JSON.parse(input):input,items=Array.isArray(data)?data:data?.projects;if(!Array.isArray(items))throw new Error('Invalid MSA One backup');items=items.filter(x=>x&&x.id&&x.type).slice(0,MAX);mirror(items);await putAll(items).catch(()=>{});return items.length}
function flush(){try{localStorage.setItem(KEY,JSON.stringify(cache));localStorage.setItem(BACKUP,JSON.stringify({version:1,saved:Date.now(),projects:cache}))}catch{}putAll(cache).catch(()=>{})}
window.MSAProjectStore={KEY,DB_NAME,list,get,save,remove,rename,duplicate,backup,restore,flush,migrateLegacy,ready:migrateLegacy()};
window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
})();