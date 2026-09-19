(()=> {
  const listeners=new Map();

  function escapeHTML(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function safeName(s='msa-one'){return String(s).trim().replace(/[^\w-]+/g,'-').replace(/^-+|-+$/g,'')||'msa-one'}
  function parseJSON(s,fallback=null){try{return JSON.parse(s)}catch{return fallback}}
  function uid(prefix='id'){return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)}
  function clamp(n,min,max){n=Number(n);return Math.min(max,Math.max(min,n))}
  function debounce(fn,ms=250){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}}
  function emit(name,detail){for(const fn of listeners.get(name)||[])try{fn(detail)}catch{};try{if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('msa:'+name,{detail}))}catch{}}
  function on(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);return()=>listeners.get(name)?.delete(fn)}
  function download(name,data,type='application/octet-stream'){
    const blob=data instanceof Blob?data:new Blob([data],{type}),u=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);
  }
  function pickFile({accept='',multiple=false,capture=''}={}){
    return new Promise(resolve=>{
      const input=document.createElement('input');input.type='file';input.hidden=true;input.accept=accept;input.multiple=multiple;
      if(capture)input.setAttribute('capture',capture);
      let done=false;const finish=(files=[])=>{if(done)return;done=true;input.remove();resolve(multiple?files:(files[0]||null))};
      input.onchange=()=>finish([...(input.files||[])]);
      input.oncancel=()=>finish([]);
      document.body.appendChild(input);input.click();
    });
  }
  function readText(file){return file?.text?file.text():Promise.resolve('')}
  function readArrayBuffer(file){return file?.arrayBuffer?file.arrayBuffer():Promise.resolve(new ArrayBuffer(0))}
  function bytesToDataURL(bytes,mime='application/octet-stream'){
    let bin='',step=0x8000;const v=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes||0);
    for(let i=0;i<v.length;i+=step)bin+=String.fromCharCode(...v.subarray(i,i+step));
    return'data:'+mime+';base64,'+btoa(bin);
  }
  function fileToDataURL(file){return new Promise((res,rej)=>{const r=new FileReader();r.onerror=()=>rej(r.error);r.onload=()=>res(r.result);r.readAsDataURL(file)})}
  function loadImage(src){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=()=>rej(new Error('Image could not be read'));img.src=src})}
  async function resizeImage(input,{max=1280,quality=.78,type='image/jpeg'}={}){
    if(typeof input!=='string'&&input?.size>25*1024*1024)throw new Error('Image is too large for safe on-device editing.');
    const src=typeof input==='string'?input:await fileToDataURL(input),img=await loadImage(src),scale=Math.min(1,max/Math.max(img.width,img.height));
    const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    return c.toDataURL(type,quality);
  }
  function dataUrlAsset(dataUrl){
    const m=String(dataUrl||'').match(/^data:(image\/(?:png|jpeg|jpg));base64,(.+)$/);if(!m)return null;
    const raw=atob(m[2]),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
    const ext=m[1].includes('png')?'png':'jpg';return{ext,data:out,mime:ext==='png'?'image/png':'image/jpeg'};
  }
  function textFromHTML(html=''){
    if(typeof document==='undefined')return String(html).replace(/<[^>]+>/g,' ');
    const d=document.createElement('div');d.innerHTML=html;d.querySelectorAll('br').forEach(x=>x.replaceWith('\n'));d.querySelectorAll('p,div,h1,h2,h3,h4,h5,h6,li').forEach(x=>x.append('\n'));
    return(d.textContent||'').replace(/\n{3,}/g,'\n\n').trim();
  }


  const PROJECT_KEY='msaOneProjectsV1';
  const PROJECT_BACKUP_KEY='msaOneProjectsBackupV1';
  const PROJECT_LAST_GOOD_KEY='msaOneProjectsLastGoodV1';
  let projectCache=null;

  function projectNormalize(project){
    if(!project||typeof project!=='object'||Array.isArray(project))return null;
    const id=String(project.id||'').trim(),type=String(project.type||'').trim();
    if(!id||!type)return null;
    const safe={...project,id:id.slice(0,160),type:type.slice(0,80)};
    if('title' in safe)safe.title=String(safe.title??'').slice(0,500);
    return safe;
  }
  function projectNormalizeList(items,limit=50){
    if(!Array.isArray(items))return null;
    const out=[],seen=new Set();
    for(const item of items.slice(0,limit)){
      const safe=projectNormalize(item);
      if(!safe||seen.has(safe.id))return null;
      seen.add(safe.id);out.push(safe);
    }
    return out;
  }
  function projectParse(raw){
    if(typeof raw!=='string')return null;
    return projectNormalizeList(parseJSON(raw,null),50);
  }
  function projectValidateRaw(raw){return projectParse(raw)!==null}
  function projectMirror(key,raw){try{globalThis.MSAStorage?.mirror?.(key,raw)}catch{}}
  function projectRecover(){
    for(const key of [PROJECT_KEY,PROJECT_LAST_GOOD_KEY,PROJECT_BACKUP_KEY]){
      const items=projectParse(localStorage.getItem(key));
      if(!items)continue;
      projectCache=items;
      if(key!==PROJECT_KEY){
        const raw=JSON.stringify(items);
        try{localStorage.setItem(PROJECT_KEY,raw);projectMirror(PROJECT_KEY,raw)}catch{}
      }
      return projectCache;
    }
    projectCache=[];
    return projectCache;
  }
  function projectAll(){
    if(projectCache)return projectCache;
    return projectRecover();
  }
  function projectWrite(items){
    const next=projectNormalizeList(items,50);
    if(!next)throw new Error('Invalid MSA One project data');
    const raw=JSON.stringify(next),previous=projectParse(localStorage.getItem(PROJECT_KEY));
    try{
      if(previous){
        const previousRaw=JSON.stringify(previous);
        localStorage.setItem(PROJECT_BACKUP_KEY,previousRaw);
        projectMirror(PROJECT_BACKUP_KEY,previousRaw);
      }
      localStorage.setItem(PROJECT_KEY,raw);
      localStorage.setItem(PROJECT_LAST_GOOD_KEY,raw);
    }catch(e){projectCache=null;throw e}
    projectCache=next;
    projectMirror(PROJECT_KEY,raw);
    projectMirror(PROJECT_LAST_GOOD_KEY,raw);
    return projectCache;
  }
  function projectGet(id){return projectAll().find(x=>x.id===id)}
  function projectUpsert(project,limit=50){
    const a=[...projectAll()],i=a.findIndex(x=>x.id===project.id);
    if(i<0)a.unshift(project);else a[i]=project;
    return projectWrite(a.slice(0,limit));
  }
  function projectRemove(id){return projectWrite(projectAll().filter(x=>x.id!==id))}
  function projectInvalidate(){projectCache=null}
  function projectFlush(){
    if(!projectCache)return true;
    const raw=JSON.stringify(projectCache);
    try{
      localStorage.setItem(PROJECT_KEY,raw);
      localStorage.setItem(PROJECT_LAST_GOOD_KEY,raw);
      projectMirror(PROJECT_KEY,raw);
      projectMirror(PROJECT_LAST_GOOD_KEY,raw);
      return true;
    }catch{return false}
  }

  if(typeof window!=='undefined'){
    window.addEventListener('pagehide',projectFlush);
    if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.hidden)projectFlush()});
  }

  globalThis.MSACore={escapeHTML,safeName,parseJSON,uid,clamp,debounce,emit,on,download,pickFile,readText,readArrayBuffer,textFromHTML};
  globalThis.MSAProjects={all:projectAll,write:projectWrite,get:projectGet,upsert:projectUpsert,remove:projectRemove,invalidate:projectInvalidate,recover:projectRecover,flush:projectFlush,validateRaw:projectValidateRaw,normalizeList:projectNormalizeList};
  globalThis.MSAMedia={fileToDataURL,loadImage,resizeImage,bytesToDataURL,dataUrlAsset};
})();