(()=> {
  const MAX_IMPORT_BYTES=32*1024*1024;
  const READABLE_EXT=new Set(['docx','xlsx','pptx','pdf','csv','tsv','txt','html','htm']);
  function plugin(){return globalThis.Capacitor?.Plugins?.MSAFileBridge||null}
  function isNative(){return !!plugin()}
  function ext(name=''){const p=String(name).toLowerCase().split('.');return p.length>1?p.pop():''}
  function supported(name){return READABLE_EXT.has(ext(name))}
  function bytesToBase64(bytes){
    let binary='',chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));
    return btoa(binary);
  }
  async function blobToBase64(blob){
    const buf=new Uint8Array(await blob.arrayBuffer());
    if(buf.byteLength>MAX_IMPORT_BYTES)throw new Error('File is too large for native export');
    return bytesToBase64(buf);
  }
  function base64ToBytes(base64){
    const raw=atob(base64),out=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
    return out;
  }
  async function status(){
    const p=plugin();if(!p?.status)return {available:false,folderPersisted:false};
    try{return await p.status()}catch{return {available:false,folderPersisted:false}}
  }
  async function pickFiles({multiple=false}={}){
    const p=plugin();if(!p?.pickFiles)throw new Error('Native file picker is unavailable');
    const result=await p.pickFiles({multiple});
    return {...result,files:Array.isArray(result?.files)?result.files.filter(x=>supported(x?.name)):[]};
  }
  async function pickFolder(){
    const p=plugin();if(!p?.pickFolder)throw new Error('Native folder picker is unavailable');
    const result=await p.pickFolder();
    return normalizeFolder(result);
  }
  async function rescanFolder(){
    const p=plugin();if(!p?.rescanFolder)throw new Error('No persisted native folder is available');
    const result=await p.rescanFolder();
    return normalizeFolder(result);
  }
  function normalizeFolder(result){
    const files=Array.isArray(result?.files)?result.files.filter(x=>supported(x?.name)): [];
    return {...result,files,supportedCount:files.length,skippedCount:Math.max(0,(Number(result?.count)||0)-files.length)};
  }
  async function readDescriptor(item){
    if(!item?.uri)throw new Error('Native file URI is missing');
    if(Number(item.size)>MAX_IMPORT_BYTES)throw new Error((item.name||'File')+' is too large');
    const p=plugin();if(!p?.readUri)throw new Error('Native file reader is unavailable');
    const data=await p.readUri({uri:item.uri});
    if(!data?.base64)throw new Error('Native file data was not returned');
    const bytes=base64ToBytes(data.base64),name=data.name||item.name||'file',type=data.mimeType||item.mimeType||'application/octet-stream';
    return new File([bytes],name,{type,lastModified:Date.now()});
  }
  async function materializeFolder(folder,{limit=100,onProgress}={}){
    const list=(folder?.files||[]).filter(x=>supported(x.name)).slice(0,limit),out=[];
    for(let i=0;i<list.length;i++){
      onProgress?.({index:i,total:list.length,item:list[i]});
      try{out.push(await readDescriptor(list[i]))}catch(e){out.push({error:e,name:list[i].name,descriptor:list[i]})}
      if((i&3)===3)await(globalThis.MSAPerformance?.yieldUI?.()||Promise.resolve());
    }
    return out;
  }
  async function saveBlob(name,blob,mimeType){
    const p=plugin();
    if(!p?.saveFile)return false;
    const base64=await blobToBase64(blob);
    return p.saveFile({name,mimeType:mimeType||blob.type||'application/octet-stream',base64});
  }
  async function clearFolder(){
    const p=plugin();if(!p?.clearFolder)return false;
    await p.clearFolder();return true;
  }
  globalThis.MSANativeFiles={MAX_IMPORT_BYTES,isNative,status,pickFiles,pickFolder,rescanFolder,readDescriptor,materializeFolder,saveBlob,clearFolder,supported};
})();