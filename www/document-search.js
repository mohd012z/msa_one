(()=>{'use strict';
  const KEY='msa.one.document-search.v1';
  const MAX_DOCS=128,MAX_TEXT=160000,MAX_SEGMENTS=5000,MAX_STORE=2500000;
  const allowed=new Set(['page','sheet','slide','section']);
  const safe=s=>String(s??'').normalize('NFKC');
  const storage=()=>globalThis.localStorage;
  function load(){
    try{
      const value=JSON.parse(storage().getItem(KEY)||'{"version":1,"documents":[]}');
      if(value.version!==1||!Array.isArray(value.documents))return [];
      return value.documents.filter(d=>d&&typeof d.id==='string'&&Array.isArray(d.segments)).slice(0,MAX_DOCS);
    }catch{return []}
  }
  function persist(docs){
    const json=JSON.stringify({version:1,documents:docs});
    if(json.length>MAX_STORE)throw new Error('SEARCH_STORAGE_LIMIT');
    storage().setItem(KEY,json);
  }
  function normalizeSegments(segments){
    if(!Array.isArray(segments)||segments.length>MAX_SEGMENTS)throw new Error('INVALID_SEGMENTS');
    let total=0;
    return segments.map((s,i)=>{
      if(!s||!allowed.has(s.kind)||!Number.isSafeInteger(s.index)||s.index<1)throw new Error('INVALID_ANCHOR');
      const text=safe(s.text);
      total+=text.length;
      if(total>MAX_TEXT)throw new Error('SEARCH_TEXT_LIMIT');
      return {kind:s.kind,index:s.index,label:safe(s.label||s.kind+' '+s.index).slice(0,120),text};
    });
  }
  function put({id,name,segments}){
    id=safe(id).trim();
    if(!id||id.length>180)throw new Error('INVALID_DOCUMENT_ID');
    const record={id,name:safe(name).slice(0,240),segments:normalizeSegments(segments),updatedAt:Date.now()};
    const docs=load().filter(d=>d.id!==id);
    docs.unshift(record);
    persist(docs.slice(0,MAX_DOCS));
    return {id,segments:record.segments.length};
  }
  function remove(id){const docs=load(),next=docs.filter(d=>d.id!==id);persist(next);return next.length!==docs.length}
  function clear(){persist([])}
  function search(query,{limit=50}={}){
    const term=safe(query).trim().toLocaleLowerCase();
    if(!term)return [];
    limit=Math.max(1,Math.min(100,Number.isSafeInteger(limit)?limit:50));
    const results=[];
    for(const doc of load())for(const seg of doc.segments){
      const hay=safe(seg.text).toLocaleLowerCase(),at=hay.indexOf(term);
      if(at<0)continue;
      const start=Math.max(0,at-64),end=Math.min(seg.text.length,at+term.length+96);
      results.push({id:doc.id,name:doc.name,kind:seg.kind,index:seg.index,label:seg.label,snippet:seg.text.slice(start,end),offset:at});
      if(results.length>=limit)return results;
    }
    return results;
  }
  globalThis.MSADocumentSearch=Object.freeze({put,remove,clear,search,list:()=>load().map(({id,name,updatedAt,segments})=>({id,name,updatedAt,segments:segments.length}))});
})();
