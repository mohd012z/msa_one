(()=> {
  const VERSION='1.0';
  const LIMITS={
    backupBytes:24*1024*1024,
    valueChars:14*1024*1024,
    projects:100,
    templates:120,
    title:240,
    richHTML:8*1024*1024,
    htmlSource:12*1024*1024
  };
  const SAFE_TAGS=new Set([
    'A','B','BR','BLOCKQUOTE','CODE','DIV','EM','H1','H2','H3','H4','H5','H6','HR','I','IMG',
    'LI','OL','P','PRE','S','SMALL','SPAN','STRONG','SUB','SUP','TABLE','TBODY','TD','TFOOT',
    'TH','THEAD','TR','U','UL'
  ]);
  const DROP_TAGS=new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','LINK','META','BASE','FORM','INPUT','BUTTON','SELECT','TEXTAREA','SVG','MATH','TEMPLATE']);
  const ATTR={
    A:new Set(['href','title']),
    IMG:new Set(['src','alt','width','height','title']),
    TD:new Set(['colspan','rowspan']),
    TH:new Set(['colspan','rowspan'])
  };

  function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function textLimit(value,max,label='value'){
    const s=String(value??'');
    if(s.length>max)throw new Error(label+' is too large');
    return s;
  }
  function isHTTPS(url,hosts=[]){
    try{
      const u=new URL(String(url));
      if(u.protocol!=='https:')return false;
      if(hosts.length&&!hosts.includes(u.hostname.toLowerCase()))return false;
      return !u.username&&!u.password;
    }catch{return false}
  }
  function safeHref(value){
    const v=String(value||'').trim();
    if(!v)return'';
    if(v.startsWith('#'))return v.slice(0,256);
    if(/^(mailto:|tel:)/i.test(v))return v.slice(0,2048);
    return isHTTPS(v)?v.slice(0,4096):'';
  }
  function safeImage(value){
    const v=String(value||'').trim();
    if(/^blob:/i.test(v))return v;
    if(/^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(v))return v;
    return'';
  }
  function sanitizeRichHTML(html){
    html=textLimit(html,LIMITS.richHTML,'Rich document');
    if(typeof document==='undefined'){
      return html
        .replace(/<\s*(script|style|iframe|object|embed|link|meta|base|form|svg|math|template)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,'')
        .replace(/\son\w+\s*=\s*(['"]).*?\1/gi,'')
        .replace(/\s(?:srcdoc|formaction|ping)\s*=\s*(['"]).*?\1/gi,'')
        .replace(/javascript\s*:/gi,'');
    }
    const root=document.createElement('div');root.innerHTML=html;
    root.querySelectorAll([...DROP_TAGS].map(x=>x.toLowerCase()).join(',')).forEach(el=>el.remove());
    [...root.querySelectorAll('*')].forEach(el=>{
      if(!SAFE_TAGS.has(el.tagName)){
        const frag=document.createDocumentFragment();
        while(el.firstChild)frag.appendChild(el.firstChild);
        el.replaceWith(frag);return;
      }
      const allowed=ATTR[el.tagName]||new Set();
      for(const a of [...el.attributes]){
        const n=a.name.toLowerCase();
        if(/^on/i.test(n)||n==='style'||n==='class'||n==='id'||n==='srcdoc'||n==='formaction'||n==='ping'||n==='target'||n==='download'||!allowed.has(n)){
          el.removeAttribute(a.name);continue;
        }
        if(el.tagName==='A'&&n==='href'){
          const safe=safeHref(a.value);safe?el.setAttribute('href',safe):el.removeAttribute('href');
        }
        if(el.tagName==='IMG'&&n==='src'){
          const safe=safeImage(a.value);safe?el.setAttribute('src',safe):el.removeAttribute('src');
        }
        if((n==='width'||n==='height')&&!/^\d{1,4}$/.test(a.value))el.removeAttribute(a.name);
        if((n==='colspan'||n==='rowspan')&&!/^\d{1,2}$/.test(a.value))el.removeAttribute(a.name);
      }
      if(el.tagName==='A'&&el.hasAttribute('href'))el.setAttribute('rel','noopener noreferrer');
    });
    return root.innerHTML;
  }
  function previewHTML(source){
    source=textLimit(source,LIMITS.htmlSource,'Smart HTML');
    const meta='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data: blob:; media-src data: blob:; font-src data:; style-src \'unsafe-inline\'; script-src \'none\'; connect-src \'none\'; frame-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'">';
    if(/<head[\s>]/i.test(source))return source.replace(/<head([^>]*)>/i,'<head$1>'+meta);
    return '<!doctype html><html><head>'+meta+'</head><body>'+source+'</body></html>';
  }
  function sanitizeProject(p){
    if(!p||typeof p!=='object')throw new Error('Invalid project');
    const type=String(p.type||'');
    if(!['document','spreadsheet','presentation','pdf','html'].includes(type))throw new Error('Unsupported project type');
    const out={...p,id:String(p.id||'').slice(0,120),type,title:textLimit(p.title||'Untitled',LIMITS.title,'Project title'),updated:Number(p.updated)||Date.now()};
    let content=textLimit(p.content??'',type==='html'?LIMITS.htmlSource:LIMITS.richHTML,'Project content');
    if(type==='document')content=sanitizeRichHTML(content);
    out.content=content;return out;
  }
  function sanitizeProjects(raw){
    const a=typeof raw==='string'?JSON.parse(raw):raw;
    if(!Array.isArray(a))throw new Error('Projects backup is invalid');
    if(a.length>LIMITS.projects)throw new Error('Backup contains too many projects');
    return a.map(sanitizeProject);
  }
  function sanitizeUserLibrary(raw){
    const u=typeof raw==='string'?JSON.parse(raw):raw;
    if(!u||typeof u!=='object')throw new Error('Personal Library backup is invalid');
    const templates=Array.isArray(u.templates)?u.templates:[];
    if(templates.length>LIMITS.templates)throw new Error('Backup contains too many personal templates');
    return {
      ...u,
      favorites:(Array.isArray(u.favorites)?u.favorites:[]).map(x=>String(x).slice(0,160)).slice(0,500),
      recent:(Array.isArray(u.recent)?u.recent:[]).map(x=>String(x).slice(0,160)).slice(0,100),
      templates:templates.map(t=>{
        const type=String(t?.type||'');
        if(!['document','spreadsheet','presentation','pdf','html'].includes(type))throw new Error('Personal template type is invalid');
        let content=textLimit(t?.content??'',type==='html'?LIMITS.htmlSource:LIMITS.richHTML,'Personal template');
        if(type==='document')content=sanitizeRichHTML(content);
        return {...t,id:String(t.id||'').slice(0,160),type,name:textLimit(t.name||'Template',120,'Template name'),title:textLimit(t.title||t.name||'Template',160,'Template title'),group:textLimit(t.group||'My Templates',80,'Template group'),icon:String(t.icon||'◇').slice(0,8),content,source:'user'};
      })
    };
  }
  function parseBackupText(text,allowedKeys=[]){
    text=textLimit(text,LIMITS.backupBytes,'Backup file');
    let data;try{data=JSON.parse(text)}catch{throw new Error('Backup JSON is invalid')}
    if(!data||typeof data!=='object'||!data.values||typeof data.values!=='object')throw new Error('Invalid backup structure');
    if(data.app&&data.app!=='MSA One')throw new Error('This backup belongs to another app');
    if(data.schema&&Number(data.schema)>1)throw new Error('This backup uses a newer format');
    const allowed=new Set(allowedKeys),values={};
    for(const [k,v] of Object.entries(data.values)){
      if(!allowed.has(k))continue;
      const raw=textLimit(v,LIMITS.valueChars,'Backup value '+k);
      if(k==='msaOneProjectsV1')values[k]=JSON.stringify(sanitizeProjects(raw));
      else if(k==='msaUserLibraryV1')values[k]=JSON.stringify(sanitizeUserLibrary(raw));
      else values[k]=raw;
    }
    if(!Object.keys(values).length)throw new Error('No compatible MSA One data was found');
    return {...data,values};
  }
  function sanitizeTemplate(t){
    const x={...t};
    x.name=textLimit(x.name||'Template',120,'Template name');
    x.title=textLimit(x.title||x.name,160,'Template title');
    x.group=textLimit(x.group||'My Templates',80,'Template group');
    if(x.type==='document')x.content=sanitizeRichHTML(x.content??'');
    else x.content=textLimit(x.content??'',x.type==='html'?LIMITS.htmlSource:LIMITS.richHTML,'Template content');
    return x;
  }
  function safeExternalOpen(url,{hosts=[]}={}){
    if(!isHTTPS(url,hosts))return false;
    try{window.open(url,'_system','noopener,noreferrer');return true}catch{return false}
  }
  function audit(){
    const cfg=globalThis.MSAPremiumConfig,manifest=globalThis.MSAAppManifest;
    return {
      version:VERSION,
      buildId:manifest?.buildId||null,
      premiumInactive:cfg?cfg.active===false:null,
      billingInactive:cfg?cfg.billing?.enabled===false:null,
      updateEnforcementInactive:cfg?cfg.updatePolicy?.enforce===false:null,
      secureContext:typeof isSecureContext==='boolean'?isSecureContext:null,
      csp:typeof document!=='undefined'?!!document.querySelector('meta[http-equiv="Content-Security-Policy"]'):null
    };
  }

  globalThis.MSASecurity={VERSION,LIMITS,isHTTPS,safeHref,safeImage,sanitizeRichHTML,previewHTML,sanitizeProject,sanitizeProjects,sanitizeUserLibrary,parseBackupText,sanitizeTemplate,safeExternalOpen,audit};
})();