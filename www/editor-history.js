(()=>{'use strict';
  const MAX=40;
  const sessions=new Map();
  const pending=new Map();

  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value))}
  function signature(value){
    if(value==null)return'';
    try{return JSON.stringify(value)}catch{return String(value)}
  }
  function cancel(key){
    const p=pending.get(key);
    if(p){clearTimeout(p.timer);pending.delete(key)}
  }
  function ensure(key,snapshot=null){
    if(!sessions.has(key))sessions.set(key,{past:[],present:snapshot==null?null:clone(snapshot),future:[]});
    return sessions.get(key);
  }
  function begin(key,snapshot){
    if(!key)return null;
    cancel(key);
    sessions.set(key,{past:[],present:clone(snapshot),future:[]});
    return status(key);
  }
  function record(key,snapshot){
    if(!key||snapshot==null)return status(key);
    cancel(key);
    const h=ensure(key);
    if(h.present==null){h.present=clone(snapshot);return status(key)}
    if(signature(h.present)===signature(snapshot))return status(key);
    h.past.push(clone(h.present));
    if(h.past.length>MAX)h.past.splice(0,h.past.length-MAX);
    h.present=clone(snapshot);
    h.future=[];
    return status(key);
  }
  function schedule(key,provider,delay=520){
    if(!key||typeof provider!=='function')return status(key);
    cancel(key);
    const timer=setTimeout(()=>{
      pending.delete(key);
      let snapshot=null;
      try{snapshot=provider()}catch{}
      if(snapshot!=null)record(key,snapshot);
    },Math.max(120,Number(delay)||520));
    pending.set(key,{timer});
    return status(key);
  }
  function checkpoint(key,provider){
    cancel(key);
    let snapshot=null;
    try{snapshot=typeof provider==='function'?provider():provider}catch{}
    if(snapshot!=null)record(key,snapshot);
    return status(key);
  }
  function undo(key,currentSnapshot=null){
    if(!key)return null;
    cancel(key);
    const h=ensure(key);
    if(currentSnapshot!=null&&signature(currentSnapshot)!==signature(h.present)){
      if(h.present!=null)h.past.push(clone(h.present));
      if(h.past.length>MAX)h.past.splice(0,h.past.length-MAX);
      h.present=clone(currentSnapshot);
      h.future=[];
    }
    if(!h.past.length)return null;
    if(h.present!=null)h.future.push(clone(h.present));
    h.present=h.past.pop();
    return clone(h.present);
  }
  function redo(key,currentSnapshot=null){
    if(!key)return null;
    cancel(key);
    const h=ensure(key);
    if(currentSnapshot!=null&&signature(currentSnapshot)!==signature(h.present)){
      record(key,currentSnapshot);
      return null;
    }
    if(!h.future.length)return null;
    if(h.present!=null)h.past.push(clone(h.present));
    h.present=h.future.pop();
    return clone(h.present);
  }
  function status(key){
    const h=key?sessions.get(key):null;
    return{
      canUndo:!!(h?.past?.length||pending.has(key)),
      canRedo:!!h?.future?.length&&!pending.has(key),
      undoDepth:h?.past?.length||0,
      redoDepth:h?.future?.length||0,
      pending:pending.has(key)
    };
  }
  function clear(key){
    cancel(key);
    sessions.delete(key);
  }
  function move(fromKey,toKey){
    if(!fromKey||!toKey||fromKey===toKey)return status(toKey||fromKey);
    cancel(fromKey);
    if(sessions.has(fromKey)){sessions.set(toKey,sessions.get(fromKey));sessions.delete(fromKey)}
    return status(toKey);
  }

  globalThis.MSAEditorHistory={MAX,begin,record,schedule,checkpoint,undo,redo,status,cancel,clear,move};
})();