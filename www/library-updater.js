(()=> {
  const STATE_KEY='msaLibraryStateV2';
  const USER_KEY='msaUserLibraryV1';
  const STATE_SCHEMA=2;

  function parse(raw,fallback){try{return JSON.parse(raw)}catch{return fallback}}
  function read(key,fallback){try{return parse(localStorage.getItem(key)||'',fallback)}catch{return fallback}}
  function write(key,value){
    const raw=JSON.stringify(value);
    try{localStorage.setItem(key,raw)}catch{}
    globalThis.MSAStorage?.mirror?.(key,raw);
    return value;
  }
  function now(){return new Date().toISOString()}
  function esc(s=''){return globalThis.MSACore?.escapeHTML?.(s)??String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function manifest(){
    return globalThis.MSAAppManifest||{app:'MSA One',version:'0.0.0',buildId:'unknown',librarySchema:STATE_SCHEMA,channel:'built-in'};
  }
  function library(){
    return globalThis.MSALibrary;
  }
  function builtInCatalog(){
    const L=library();
    return {
      modules:(L?.modules||[]).map(x=>x.id),
      templates:(L?.templates||[]).map(x=>x.id)
    };
  }
  function userData(){
    const u=read(USER_KEY,{schema:1,favorites:[],templates:[],recent:[]});
    if(!Array.isArray(u.favorites))u.favorites=[];
    if(!Array.isArray(u.templates))u.templates=[];
    if(!Array.isArray(u.recent))u.recent=[];
    return u;
  }
  function saveUser(u){return write(USER_KEY,u)}
  function state(){
    return read(STATE_KEY,{schema:STATE_SCHEMA,lastBuild:null,lastVersion:null,lastSync:null,catalog:null,lastUpdate:null,history:[],ackBuild:null});
  }
  function diff(oldList=[],newList=[]){
    const before=new Set(oldList),after=new Set(newList);
    return {added:newList.filter(x=>!before.has(x)),removed:oldList.filter(x=>!after.has(x))};
  }
  function sync(options={}){
    const force=!!options.force,quiet=!!options.quiet,m=manifest(),catalog=builtInCatalog(),s=state(),first=!s.catalog;
    const moduleDiff=diff(s.catalog?.modules||[],catalog.modules);
    const templateDiff=diff(s.catalog?.templates||[],catalog.templates);
    const changed=force||first||s.lastBuild!==m.buildId||moduleDiff.added.length||moduleDiff.removed.length||templateDiff.added.length||templateDiff.removed.length;
    let update=s.lastUpdate;
    if(changed){
      if(!first&&s.lastBuild!==m.buildId){
        update={
          fromBuild:s.lastBuild,
          fromVersion:s.lastVersion,
          toBuild:m.buildId,
          toVersion:m.version,
          at:now(),
          addedModules:moduleDiff.added,
          removedModules:moduleDiff.removed,
          addedTemplates:templateDiff.added,
          removedTemplates:templateDiff.removed
        };
      }else if(first){
        update={fromBuild:null,fromVersion:null,toBuild:m.buildId,toVersion:m.version,at:now(),addedModules:[],removedModules:[],addedTemplates:[],removedTemplates:[]};
      }else if(force){
        update={...(s.lastUpdate||{}),toBuild:m.buildId,toVersion:m.version,at:now()};
      }
      const history=[...(s.history||[])];
      if(update&&update.fromBuild&&(!history[0]||history[0].toBuild!==update.toBuild))history.unshift(update);
      write(STATE_KEY,{
        schema:STATE_SCHEMA,
        lastBuild:m.buildId,
        lastVersion:m.version,
        lastSync:now(),
        catalog,
        lastUpdate:update,
        history:history.slice(0,12),
        ackBuild:first?m.buildId:(s.ackBuild||null)
      });
      if(!quiet&&!first&&s.lastBuild!==m.buildId){
        const n=moduleDiff.added.length+templateDiff.added.length;
        globalThis.MSAHelper?.notify?.('Built-in Library synced to '+m.version+(n?' · '+n+' new item'+(n===1?'':'s'):'')+'.','success');
      }
    }else{
      write(STATE_KEY,{...s,lastSync:now()});
    }
    if(typeof document!=='undefined')globalThis.MSALibrary?.render?.();
    return status();
  }
  function status(){
    const s=state(),m=manifest(),u=userData(),catalog=builtInCatalog();
    const pending=!!(s.lastUpdate?.fromBuild&&s.ackBuild!==m.buildId);
    return {
      app:m.app,version:m.version,buildId:m.buildId,channel:m.channel,
      librarySchema:m.librarySchema||STATE_SCHEMA,
      lastSync:s.lastSync,
      builtInModules:catalog.modules.length,
      builtInTemplates:catalog.templates.length,
      userTemplates:u.templates.length,
      favorites:u.favorites.length,
      pendingUpdate:pending,
      lastUpdate:s.lastUpdate,
      history:s.history||[]
    };
  }
  function acknowledge(){
    const s=state(),m=manifest();write(STATE_KEY,{...s,ackBuild:m.buildId});if(typeof document!=='undefined')globalThis.MSALibrary?.render?.();return status();
  }
  function isFavorite(id){return userData().favorites.includes(id)}
  function toggleFavorite(id){
    const u=userData(),set=new Set(u.favorites);
    set.has(id)?set.delete(id):set.add(id);u.favorites=[...set];saveUser(u);if(typeof document!=='undefined')globalThis.MSALibrary?.render?.();return set.has(id);
  }
  function markRecent(id){
    const u=userData();u.recent=[id,...u.recent.filter(x=>x!==id)].slice(0,20);saveUser(u);
  }
  function userTemplates(){return userData().templates}
  function addUserTemplate(t){
    if(!t||!t.type||!t.name)throw new Error('Template type and name are required');
    const u=userData(),id=t.id||('user-'+(globalThis.MSACore?.uid?.('tpl')||Date.now().toString(36)));
    let item={id,type:t.type,icon:t.icon||'◇',name:String(t.name).slice(0,80),group:t.group||'My Templates',title:t.title||t.name,content:String(t.content??''),source:'user',created:now(),updated:now()};
    if(globalThis.MSASecurity?.sanitizeTemplate)item=globalThis.MSASecurity.sanitizeTemplate(item);
    const i=u.templates.findIndex(x=>x.id===id);i<0?u.templates.unshift(item):u.templates[i]={...u.templates[i],...item,updated:now()};saveUser(u);if(typeof document!=='undefined')globalThis.MSALibrary?.render?.();return item;
  }
  function removeUserTemplate(id){
    const u=userData();u.templates=u.templates.filter(x=>x.id!==id);u.favorites=u.favorites.filter(x=>x!==id);saveUser(u);if(typeof document!=='undefined')globalThis.MSALibrary?.render?.();
  }
  function updateSummary(){
    const st=status(),u=st.lastUpdate;
    if(!st.pendingUpdate||!u)return[];
    const out=[];
    if(u.addedModules?.length)out.push('New modules: '+u.addedModules.join(', '));
    if(u.addedTemplates?.length)out.push('New templates: '+u.addedTemplates.join(', '));
    if(u.removedModules?.length)out.push('Retired modules: '+u.removedModules.join(', '));
    if(u.removedTemplates?.length)out.push('Retired templates: '+u.removedTemplates.join(', '));
    if(!out.length)out.push('Library index refreshed for this app build.');
    return out;
  }
  function panelHTML(){
    const st=status(),u=st.lastUpdate,summary=updateSummary(),date=st.lastSync?new Date(st.lastSync).toLocaleString():'Not synced yet';
    return '<section class="library-update-card" data-library-update-panel>'+
      '<div class="library-update-head"><div><span class="library-update-kicker">APP → LIBRARY AUTO-SYNC</span><h2>'+esc(st.app)+' '+esc(st.version)+'</h2><p>Built-in capabilities are indexed from the installed app build. Your favorites and personal templates stay separate.</p></div><span class="library-sync-badge '+(st.pendingUpdate?'new':'ok')+'">'+(st.pendingUpdate?'NEW':'SYNCED')+'</span></div>'+
      '<div class="library-update-stats"><span><b>'+st.builtInModules+'</b> modules</span><span><b>'+st.builtInTemplates+'</b> built-in templates</span><span><b>'+st.userTemplates+'</b> my templates</span><span><b>'+st.favorites+'</b> favorites</span></div>'+
      '<div class="library-update-meta"><span>Build '+esc(st.buildId)+'</span><span>Last sync '+esc(date)+'</span><span>Schema '+esc(st.librarySchema)+'</span></div>'+
      (st.pendingUpdate?'<div class="library-whats-new"><b>What changed</b>'+summary.map(x=>'<p>• '+esc(x)+'</p>').join('')+'<button data-library-ack>Mark as seen</button></div>':'')+
      '<div class="library-update-actions"><button data-library-resync>↻ Re-index library</button><button data-library-history>Update history</button></div><div class="library-history" data-library-history-panel hidden></div>'+
      '</section>';
  }
  function bindPanel(root=(typeof document!=='undefined'?document:null)){
    if(!root)return;
    const resync=root.querySelector?.('[data-library-resync]');
    if(resync)resync.onclick=()=>{sync({force:true,quiet:true});globalThis.MSAHelper?.success?.('Library re-indexed from the installed app build.')};
    const ack=root.querySelector?.('[data-library-ack]');
    if(ack)ack.onclick=acknowledge;
    const history=root.querySelector?.('[data-library-history]'),panel=root.querySelector?.('[data-library-history-panel]');
    if(history&&panel)history.onclick=()=>{
      panel.hidden=!panel.hidden;if(panel.hidden)return;
      const items=status().history;
      panel.innerHTML=items.length?items.map(x=>'<article><b>'+esc(x.toVersion||x.toBuild)+'</b><small>'+esc(x.at||'')+'</small><p>'+(x.addedModules?.length?esc('Modules +'+x.addedModules.join(', ')):'Library refresh')+'</p></article>').join(''):'<div class="library-empty">No previous app/library updates recorded on this device.</div>';
    };
    root.querySelectorAll?.('[data-library-favorite]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFavorite(b.dataset.libraryFavorite)});
  }
  function mount(){
    sync({quiet:true});
  }

  globalThis.MSALibraryUpdate={state,status,sync,acknowledge,isFavorite,toggleFavorite,markRecent,userTemplates,addUserTemplate,removeUserTemplate,panelHTML,bindPanel,updateSummary};
  if(typeof document!=='undefined'){document.addEventListener('DOMContentLoaded',mount);setTimeout(mount,900)}
})();