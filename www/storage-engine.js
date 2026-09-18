(()=> {
  const DB='MSAOneDB', STORE='kv';
  const KEYS=['msaOneProjectsV1','msaOnePlannerV1','msaOneProfileV1','msaButtonShape','msaButtonEffect','msaButtonIntensity','msaOneLanguage','msaHelperV1'];

  function db(){
    return new Promise((resolve,reject)=>{
      const r=indexedDB.open(DB,1);
      r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });
  }
  async function set(key,value){
    try{const d=await db();await new Promise((res,rej)=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).put(value,key);t.oncomplete=res;t.onerror=()=>rej(t.error)});d.close();return true}catch{return false}
  }
  async function get(key){
    try{const d=await db();const v=await new Promise((res,rej)=>{const t=d.transaction(STORE,'readonly'),r=t.objectStore(STORE).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});d.close();return v}catch{return undefined}
  }
  async function mirror(key,value){return set(key,value)}
  async function bootstrap(){
    for(const key of KEYS){
      const local=localStorage.getItem(key);
      if(local!=null) await set(key,local);
      else{
        const saved=await get(key);
        if(saved!=null) localStorage.setItem(key,saved);
      }
    }
  }
  function snapshot(){
    const data={schema:1,app:'MSA One',created:new Date().toISOString(),values:{}};
    for(const key of KEYS){const v=localStorage.getItem(key);if(v!=null)data.values[key]=v}
    return data;
  }
  function downloadBackup(){
    const data=JSON.stringify(snapshot(),null,2),blob=new Blob([data],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=u;a.download='msa-one-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),800);
  }
  function importBackup(){
    const input=document.createElement('input');input.type='file';input.accept='application/json,.json';input.hidden=true;
    input.onchange=async()=>{const f=input.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!data.values||typeof data.values!=='object')throw new Error('Invalid backup');for(const [k,v] of Object.entries(data.values)){if(KEYS.includes(k)){localStorage.setItem(k,String(v));await set(k,String(v))}}alert('MSA One backup restored. The app will reload.');location.reload()}catch(e){alert('Backup could not be restored: '+e.message)}};
    document.body.appendChild(input);input.click();setTimeout(()=>input.remove(),1000);
  }
  window.MSAStorage={set,get,mirror,bootstrap,snapshot,downloadBackup,importBackup};
  document.addEventListener('DOMContentLoaded',bootstrap);
  setTimeout(bootstrap,500);
})();