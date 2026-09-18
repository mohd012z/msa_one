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

  globalThis.MSACore={escapeHTML,safeName,parseJSON,uid,clamp,debounce,emit,on,download,pickFile,readText,readArrayBuffer,textFromHTML};
  globalThis.MSAMedia={fileToDataURL,loadImage,resizeImage,bytesToDataURL,dataUrlAsset};
})();