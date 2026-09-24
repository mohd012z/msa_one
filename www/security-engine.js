(()=> {
  const VERSION='1.0';
  const LIMITS={
    backupBytes:24*1024*1024,
    valueChars:14*1024*1024,
    projects:100,
    templates:120,
    lolaReports:24,
    lolaFindings:200,
    lolaEvidence:200,
    title:240,
    richHTML:8*1024*1024,
    htmlSource:12*1024*1024,
    lolaState:512*1024,
    lolaText:2000,
    lolaSnippet:4000
  };
  const SAFE_TAGS=new Set([
    'A','B','BR','BLOCKQUOTE','CODE','DIV','EM','FONT','H1','H2','H3','H4','H5','H6','HR','I','IMG',
    'LI','OL','P','PRE','S','SMALL','SPAN','STRONG','SUB','SUP','TABLE','TBODY','TD','TFOOT',
    'TH','THEAD','TR','U','UL'
  ]);
  const DROP_TAGS=new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','LINK','META','BASE','FORM','INPUT','BUTTON','SELECT','TEXTAREA','SVG','MATH','TEMPLATE']);
  const ATTR={
    A:new Set(['href','title']),
    IMG:new Set(['src','alt','width','height','title']),
    TD:new Set(['colspan','rowspan']),
    TH:new Set(['colspan','rowspan']),
    FONT:new Set(['face','size'])
  };
  const SAFE_FONT_FACE=/^[A-Za-z][A-Za-z0-9 \-]{0,39}$/;
  const SAFE_FONT_SIZE=/^[1-7]$/;

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
        .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,'')
        .replace(/\s(?:srcdoc|formaction|ping|style)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,'')
        .replace(/javascript\s*:/gi,'')
        .replace(/(<font\b[^>]*)\sface\s*=\s*"([^"]*)"/gi,(m,pre,v)=>SAFE_FONT_FACE.test(v)?m:pre)
        .replace(/(<font\b[^>]*)\sface\s*=\s*'([^']*)'/gi,(m,pre,v)=>SAFE_FONT_FACE.test(v)?m:pre)
        .replace(/(<font\b[^>]*)\ssize\s*=\s*"([^"]*)"/gi,(m,pre,v)=>SAFE_FONT_SIZE.test(v)?m:pre)
        .replace(/(<font\b[^>]*)\ssize\s*=\s*'([^']*)'/gi,(m,pre,v)=>SAFE_FONT_SIZE.test(v)?m:pre);
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
        if(el.tagName==='FONT'&&n==='face'&&!SAFE_FONT_FACE.test(a.value))el.removeAttribute('face');
        if(el.tagName==='FONT'&&n==='size'&&!SAFE_FONT_SIZE.test(a.value))el.removeAttribute('size');
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
  function lolaText(value,max=LIMITS.lolaText,label='Lola value'){
    return textLimit(String(value??''),max,label);
  }
  function sanitizeLolaOptions(profile,raw){
    const profiles={
      'source-security-scan':['semgrepRules','dependencyInventory','changedFilesOnly'],
      'apk-inspection':['manifestSummary','permissionReview','signingOverview']
    };
    const safe={},allowed=profiles[profile]||[];
    for(const key of allowed)safe[key]=!!raw?.[key];
    return safe;
  }
  function sanitizeLolaManifest(value){
    if(!value||typeof value!=='object')throw new Error('Lola manifest is invalid');
    const profile=value?.job?.profile||value?.job?.type;
    if(!['source-security-scan','apk-inspection'].includes(profile))throw new Error('Lola manifest profile is invalid');
    const out={
      schema:lolaText(value.schema||'',80,'Lola manifest schema'),
      manifestVersion:Number(value.manifestVersion)||1,
      createdAt:lolaText(value.createdAt||'',80,'Lola manifest createdAt'),
      sourceApp:{
        name:lolaText(value.sourceApp?.name||'',80,'Lola source app'),
        project:lolaText(value.sourceApp?.project||'',80,'Lola source project')
      },
      companion:{
        name:lolaText(value.companion?.name||'',80,'Lola companion name'),
        repository:isHTTPS(value.companion?.repository)?String(value.companion.repository).slice(0,4096):'',
        execution:lolaText(value.companion?.execution||'',120,'Lola execution')
      },
      job:{
        id:lolaText(value.job?.id||'',160,'Lola job id'),
        type:profile,
        profile,
        options:sanitizeLolaOptions(profile,value.job?.options)
      },
      context:{},
      provenance:{
        generatedBy:lolaText(value.provenance?.generatedBy||'',160,'Lola generatedBy'),
        transfer:lolaText(value.provenance?.transfer||'',160,'Lola transfer'),
        localOnly:!!value.provenance?.localOnly
      },
      limitations:(Array.isArray(value.limitations)?value.limitations:[]).slice(0,12).map(v=>lolaText(v,240,'Lola limitation'))
    };
    if(value.context?.project&&typeof value.context.project==='object')out.context.project={
      id:lolaText(value.context.project.id||'',160,'Lola project id'),
      title:lolaText(value.context.project.title||'',160,'Lola project title'),
      type:lolaText(value.context.project.type||'',80,'Lola project type')
    };
    if(value.context?.input&&typeof value.context.input==='object')out.context.input={
      kind:lolaText(value.context.input.kind||'',80,'Lola input kind'),
      label:lolaText(value.context.input.label||'',160,'Lola input label')
    };
    if('packageName' in (value.context||{}))out.context.packageName=lolaText(value.context.packageName||'',160,'Lola package name');
    if('notes' in (value.context||{}))out.context.notes=lolaText(value.context.notes||'',1200,'Lola notes');
    return out;
  }
  function sanitizeLolaFinding(item){
    if(!item||typeof item!=='object')throw new Error('Lola finding is invalid');
    return {
      id:lolaText(item.id||'',120,'Lola finding id'),
      title:lolaText(item.title||'Finding',160,'Lola finding title'),
      severity:lolaText(item.severity||'info',40,'Lola finding severity'),
      confidence:lolaText(item.confidence||'',40,'Lola finding confidence'),
      message:lolaText(item.message||'',1200,'Lola finding message'),
      path:lolaText(item.path||'',240,'Lola finding path'),
      line:Number(item.line)||0,
      snippet:lolaText(item.snippet||'',LIMITS.lolaSnippet,'Lola finding snippet'),
      tags:(Array.isArray(item.tags)?item.tags:[]).slice(0,12).map(v=>lolaText(v,60,'Lola finding tag'))
    };
  }
  function sanitizeLolaEvidence(item){
    if(!item||typeof item!=='object')throw new Error('Lola evidence is invalid');
    return {
      kind:lolaText(item.kind||'note',60,'Lola evidence kind'),
      label:lolaText(item.label||'Evidence',160,'Lola evidence label'),
      detail:lolaText(item.detail||'',1200,'Lola evidence detail'),
      path:lolaText(item.path||'',240,'Lola evidence path'),
      digest:lolaText(item.digest||'',160,'Lola evidence digest'),
      command:lolaText(item.command||'',240,'Lola evidence command'),
      sizeBytes:Math.max(0,Number(item.sizeBytes)||0)
    };
  }
  function sanitizeLolaReport(value){
    if(!value||typeof value!=='object')throw new Error('Lola report is invalid');
    const profile=lolaText(value.profile||'',80,'Lola report profile');
    if(!['source-security-scan','apk-inspection'].includes(profile))throw new Error('Lola report profile is invalid');
    const findings=(Array.isArray(value.findings)?value.findings:[]);
    const evidence=(Array.isArray(value.evidence)?value.evidence:[]);
    if(findings.length>LIMITS.lolaFindings)throw new Error('Lola report contains too many findings');
    if(evidence.length>LIMITS.lolaEvidence)throw new Error('Lola report contains too many evidence entries');
    return {
      schema:lolaText(value.schema||'',80,'Lola report schema'),
      resultVersion:Number(value.resultVersion)||1,
      manifestVersion:Number(value.manifestVersion)||1,
      manifestId:lolaText(value.manifestId||'',160,'Lola manifest id'),
      profile,
      generator:{
        tool:lolaText(value.generator?.tool||'',120,'Lola generator tool'),
        version:lolaText(value.generator?.version||'',80,'Lola generator version'),
        repository:isHTTPS(value.generator?.repository)?String(value.generator.repository).slice(0,4096):''
      },
      provenance:{
        generatedAt:lolaText(value.provenance?.generatedAt||'',80,'Lola generatedAt'),
        sourceHost:lolaText(value.provenance?.sourceHost||'',120,'Lola source host'),
        sourcePath:lolaText(value.provenance?.sourcePath||'',240,'Lola source path')
      },
      association:{
        projectId:lolaText(value.association?.projectId||'',160,'Lola project association'),
        projectTitle:lolaText(value.association?.projectTitle||'',160,'Lola project title')
      },
      summary:{
        headline:lolaText(value.summary?.headline||'',160,'Lola summary headline'),
        verdict:lolaText(value.summary?.verdict||'review',40,'Lola summary verdict'),
        findingCount:Math.max(0,Number(value.summary?.findingCount)||findings.length),
        evidenceCount:Math.max(0,Number(value.summary?.evidenceCount)||evidence.length)
      },
      findings:findings.map(sanitizeLolaFinding),
      evidence:evidence.map(sanitizeLolaEvidence),
      limitations:(Array.isArray(value.limitations)?value.limitations:[]).slice(0,12).map(v=>lolaText(v,240,'Lola report limitation'))
    };
  }
  function sanitizeLolaState(raw){
    const value=typeof raw==='string'?JSON.parse(raw):raw;
    if(!value||typeof value!=='object')throw new Error('Lola state is invalid');
    const reports=(Array.isArray(value.reports)?value.reports:[]);
    if(reports.length>LIMITS.lolaReports)throw new Error('Too many Lola reports were stored');
    const out={
      schema:1,
      draft:{
        projectId:lolaText(value.draft?.projectId||'',160,'Lola draft project'),
        profile:['source-security-scan','apk-inspection'].includes(value.draft?.profile)?value.draft.profile:'source-security-scan',
        contextLabel:lolaText(value.draft?.contextLabel||'',160,'Lola draft label'),
        packageName:lolaText(value.draft?.packageName||'',160,'Lola draft package'),
        notes:lolaText(value.draft?.notes||'',1200,'Lola draft notes'),
        options:sanitizeLolaOptions(['source-security-scan','apk-inspection'].includes(value.draft?.profile)?value.draft.profile:'source-security-scan',value.draft?.options)
      },
      reports:reports.map(report=>({
        id:lolaText(report.id||'',160,'Lola stored report id'),
        importedAt:lolaText(report.importedAt||'',80,'Lola importedAt'),
        projectId:lolaText(report.projectId||'',160,'Lola stored project id'),
        report:sanitizeLolaReport(report.report)
      }))
    };
    if(value.lastManifest)out.lastManifest=sanitizeLolaManifest(value.lastManifest);
    return out;
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
      else if(k==='msaLolaStateV1'){if(raw.length>LIMITS.lolaState)throw new Error('Lola state is too large');values[k]=JSON.stringify(sanitizeLolaState(raw))}
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

  globalThis.MSASecurity={VERSION,LIMITS,isHTTPS,safeHref,safeImage,sanitizeRichHTML,previewHTML,sanitizeProject,sanitizeProjects,sanitizeUserLibrary,sanitizeLolaState,parseBackupText,sanitizeTemplate,safeExternalOpen,audit};
})();