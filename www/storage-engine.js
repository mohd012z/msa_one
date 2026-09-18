(()=> {
  const DB='MSAOneDB', STORE='kv';
  const KEYS=['msaOneProjectsV1','msaOnePlannerV1','msaOneProfileV1','msaButtonShape','msaButtonEffect','msaButtonIntensity','msaOneLanguage','msaHelperV1','msaPerformanceV1','msaLibraryStateV2','msaUserLibraryV1'];

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
    try{
      const locals=new Map(),missing=[];
      for(const key of KEYS){const local=localStorage.getItem(key);if(local!=null)locals.set(key,local);else missing.push(key)}
      const d=await db();
      if(locals.size){
        await new Promise((res,rej)=>{
          const t=d.transaction(STORE,'readwrite'),store=t.objectStore(STORE);
          for(const [k,v] of locals)store.put(v,k);
          t.oncomplete=res;t.onerror=()=>rej(t.error);
        });
      }
      if(missing.length){
        const values=await new Promise((res,rej)=>{
          const t=d.transaction(STORE,'readonly'),store=t.objectStore(STORE),out={};let left=missing.length;
          if(!left)return res(out);
          for(const k of missing){const r=store.get(k);r.onsuccess=()=>{out[k]=r.result;if(--left===0)res(out)};r.onerror=()=>rej(r.error)}
        });
        for(const k of missing)if(values[k]!=null)localStorage.setItem(k,values[k]);
      }
      d.close();
    }catch{}
    globalThis.MSAProjects?.invalidate?.();
  }
  function snapshot(){
    const data={schema:1,app:'MSA One',created:new Date().toISOString(),values:{}};
    for(const key of KEYS){const v=localStorage.getItem(key);if(v!=null)data.values[key]=v}
    return data;
  }
  function downloadBackup(){
    const data=JSON.stringify(snapshot(),null,2),name='msa-one-backup-'+new Date().toISOString().slice(0,10)+'.json';
    if(window.MSACore?.download)window.MSACore.download(name,data,'application/json');
    else{const blob=new Blob([data],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),800)}
  }
  function importBackup(){
    const input=document.createElement('input');input.type='file';input.accept='application/json,.json';input.hidden=true;
    input.onchange=async()=>{
      const f=input.files?.[0];if(!f){input.remove();return}
      try{
        const data=JSON.parse(await f.text());
        if(!data||typeof data!=='object'||!data.values||typeof data.values!=='object')throw new Error('Invalid backup structure');
        if(data.app&&data.app!=='MSA One')throw new Error('This backup belongs to another app');
        if(data.schema&&Number(data.schema)>1)throw new Error('This backup uses a newer format');
        const entries=Object.entries(data.values).filter(([k])=>KEYS.includes(k));
        if(!entries.length)throw new Error('No compatible MSA One data was found');
        for(const [k,v] of entries){localStorage.setItem(k,String(v));await set(k,String(v))}
        if(window.MSAHelper?.success)window.MSAHelper.success('Backup restored. MSA One will reload.');
        setTimeout(()=>location.reload(),650);
      }catch(e){
        if(window.MSAHelper?.error)window.MSAHelper.error('Backup could not be restored: '+e.message,[{label:'Help',run:()=>window.MSAHelper.open('trouble')}]);
        else alert('Backup could not be restored: '+e.message);
      }finally{input.remove()}
    };
    input.oncancel=()=>input.remove();
    document.body.appendChild(input);input.click();
  }
  window.MSAStorage={set,get,mirror,bootstrap,snapshot,downloadBackup,importBackup};
  document.addEventListener('DOMContentLoaded',bootstrap);
  setTimeout(bootstrap,500);
})();