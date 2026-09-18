(()=> {
 let root=null,menu=null,sheet=null,zoom=1,startDist=0,startZoom=1;
 const configs={
  document:{accent:'#6b93ef',tabs:['Home','Insert','Draw','Layout','Review','View'],tools:[['B','Bold','bold'],['𝘐','Italic','italic'],['U','Underline','underline'],['☷','Bullets','insertUnorderedList'],['≡','Align','justifyLeft'],['⌕','Find','find']]},
  spreadsheet:{accent:'#76bd91',tabs:['Home','Insert','Draw','Formulas','Data','Review','View'],tools:[['B','Bold','bold'],['𝘐','Italic','italic'],['U','Underline','underline'],['▦','Borders','noop'],['↔','Merge','noop'],['Σ','AutoSum','sum'],['⌕','Search','find']]},
  pdf:{accent:'#e76069',tabs:['Home','Annotate','Fill & Sign','Convert','View'],tools:[['＋','Create','newpdf'],['✎','Edit','noop'],['⌕','Find','find'],['↥','Share','share'],['⋯','More','more']]},
  presentation:{accent:'#df8b62',tabs:['Home','Insert','Draw','Design','Transitions','Review','View'],tools:[['B','Bold','noop'],['＋','Slide','slide'],['▣','Layout','noop'],['✎','Draw','noop'],['▶','Present','noop']]},
  html:{accent:'#61c8d4',tabs:['Home','Insert','Preview','View'],tools:[['</>','Code','noop'],['◉','Preview','noop'],['⌕','Find','find']]}
 };
 function studio(){return document.querySelector('.studio-overlay.on')}
 function type(){const s=studio();return s?.querySelector('.studio-type.on')?.dataset.type||'document'}
 function ensure(){
  if(root)return;
  root=document.createElement('div');root.className='office-mobile-shell';root.innerHTML='<div class="office-ribbon" data-ribbon><div class="office-ribbon-head"><button class="office-home-btn" data-tabs>Home⌄</button><span style="flex:1"></span><button class="office-icon-btn" data-undo>↶</button><button class="office-icon-btn" data-redo>↷</button><button class="office-icon-btn" data-more>⋯</button></div><div class="office-ribbon-tools" data-tools></div></div><div class="office-zoom-hud"><button data-zout>−</button><output data-zlabel>100%</output><button data-zin>＋</button><button data-zreset>1:1</button></div>';
  document.body.appendChild(root);
  root.querySelector('[data-tabs]').onclick=toggleTabs;root.querySelector('[data-more]').onclick=showMore;
  root.querySelector('[data-undo]').onclick=()=>document.execCommand('undo');root.querySelector('[data-redo]').onclick=()=>document.execCommand('redo');
  root.querySelector('[data-zout]').onclick=()=>setZoom(zoom-.1);root.querySelector('[data-zin]').onclick=()=>setZoom(zoom+.1);root.querySelector('[data-zreset]').onclick=()=>setZoom(1);
  root.style.display='none';
  document.addEventListener('touchstart',pinchStart,{passive:true});document.addEventListener('touchmove',pinchMove,{passive:false});document.addEventListener('touchend',()=>{startDist=0},{passive:true});
  document.addEventListener('wheel',e=>{if(!studio()||!e.ctrlKey)return;e.preventDefault();setZoom(zoom+(e.deltaY<0?.1:-.1))},{passive:false});
 }
 function distance(t){const a=t[0],b=t[1];return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)}
 function pinchStart(e){if(!studio()||e.touches.length!==2||!e.target.closest('[data-work]'))return;startDist=distance(e.touches);startZoom=zoom}
 function pinchMove(e){if(!startDist||e.touches.length!==2)return;e.preventDefault();setZoom(startZoom*distance(e.touches)/startDist)}
 function setZoom(v){zoom=Math.max(.55,Math.min(2.5,Math.round(v*20)/20));document.documentElement.style.setProperty('--office-zoom',zoom);root?.querySelector('[data-zlabel]')&&(root.querySelector('[data-zlabel]').value=Math.round(zoom*100)+'%')}
 function refresh(){
  ensure();const s=studio();if(!s){root.style.display='none';return}
  root.style.display='block';s.classList.add('office-mobile','office-fullpage');const c=configs[type()]||configs.document;document.documentElement.style.setProperty('--office-accent',c.accent);
  const work=s.querySelector('[data-work]');if(work)work.classList.add('office-zoom-target');
  const tools=root.querySelector('[data-tools]');tools.innerHTML=c.tools.map(x=>'<button data-action="'+x[2]+'"><b>'+x[0]+'</b><span>'+x[1]+'</span></button>').join('');
  tools.querySelectorAll('button').forEach(b=>b.onclick=()=>action(b.dataset.action));
  const title=s.querySelector('[data-title]')?.value||'';root.querySelector('[data-tabs]').title=title;
 }
 function action(a){
  const s=studio(),t=type();
  if(['bold','italic','underline','insertUnorderedList','justifyLeft'].includes(a)){const ed=s?.querySelector('[data-doc]');ed?.focus();document.execCommand(a,false,null);ed?.dispatchEvent(new Event('input',{bubbles:true}));return}
  if(a==='sum'&&t==='spreadsheet'){const cell=s?.querySelector('[data-cell]:focus')||s?.querySelector('[data-cell]');if(cell){cell.value='=SUM(A1:A10)';cell.dispatchEvent(new Event('input',{bubbles:true}));cell.focus()}return}
  if(a==='slide'){s?.querySelector('[data-add-slide]')?.click();return}
  if(a==='newpdf'){s?.querySelector('[data-pdf-new]')?.click();return}
  if(a==='more'){showMore();return}
  if(a==='find'){const q=prompt('Find');if(q)window.find?.(q);return}
  if(a==='share'){showMore();return}
 }
 function toggleTabs(){
  if(menu){menu.remove();menu=null;return}const c=configs[type()]||configs.document;
  menu=document.createElement('div');menu.className='office-tab-menu';menu.innerHTML=c.tabs.map((x,i)=>'<button class="'+(!i?'on':'')+'">'+x+'</button>').join('');
  menu.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{root.querySelector('[data-tabs]').textContent=b.textContent+'⌄';menu.remove();menu=null});
  document.body.appendChild(menu);
 }
 function showMore(){
  if(sheet){hideMore();return}
  const s=studio(),name=s?.querySelector('[data-title]')?.value||'Untitled',kind=type();
  sheet=document.createElement('div');sheet.className='office-more-sheet';sheet.innerHTML='<div class="office-sheet-grab"></div><div class="office-sheet-title"><h2>More Options</h2><button data-x>×</button></div><div class="office-action-card"><button class="office-action"><i>'+({document:'📄',spreadsheet:'📊',pdf:'📕'}[kind]||'📄')+'</i><b>'+escapeHtml(name)+'<small> · '+kind.toUpperCase()+'</small></b><span>›</span></button></div><h3>File Actions</h3><div class="office-action-card"><button class="office-action" data-save><i>▣</i><b>Save<small>Autosave local workspace</small></b><span>›</span></button><button class="office-action" data-copy><i>⧉</i><b>Save a Copy</b><span>›</span></button><button class="office-action" data-export><i>↥</i><b>Export</b><span>›</span></button><button class="office-action" data-print><i>▤</i><b>Print</b><span>›</span></button><button class="office-action" data-rename><i>✎</i><b>Rename</b><span>›</span></button></div><div class="office-action-card"><button class="office-action" data-zoom><i>⌕</i><b>Reset Zoom<small>Pinch anywhere on the page to zoom</small></b><span>100%</span></button><button class="office-action" data-read><i>◉</i><b>Reading View</b><span>›</span></button></div>';
  document.body.appendChild(sheet);bindSheetDrag(sheet);sheet.querySelector('[data-x]').onclick=hideMore;sheet.querySelector('[data-save]').onclick=()=>s?.querySelector('[data-save]')?.click();sheet.querySelector('[data-copy]').onclick=()=>s?.querySelector('[data-export]')?.click();sheet.querySelector('[data-export]').onclick=()=>s?.querySelector('[data-export]')?.click();sheet.querySelector('[data-print]').onclick=()=>window.print();sheet.querySelector('[data-rename]').onclick=()=>s?.querySelector('[data-title]')?.focus();sheet.querySelector('[data-zoom]').onclick=()=>setZoom(1);sheet.querySelector('[data-read]').onclick=()=>window.MSAPerformance?.toggleReading?.();
 }
 function hideMore(){
  if(!sheet)return;const current=sheet;sheet=null;current.classList.add('dismissing');setTimeout(()=>current.remove(),230);
 }
 function bindSheetDrag(el){
  const handle=el.querySelector('.office-sheet-grab'),title=el.querySelector('.office-sheet-title');let active=false,startY=0,lastY=0;
  const start=e=>{active=true;startY=(e.touches?.[0]?.clientY??e.clientY);lastY=startY;el.classList.add('dragging')};
  const move=e=>{if(!active)return;const y=(e.touches?.[0]?.clientY??e.clientY),dy=Math.max(0,y-startY);lastY=y;el.style.transform='translateY('+dy+'px)'};
  const end=()=>{if(!active)return;active=false;el.classList.remove('dragging');const dy=Math.max(0,lastY-startY);if(dy>90){hideMore();return}el.style.transform='';};
  [handle,title].filter(Boolean).forEach(target=>{target.addEventListener('touchstart',start,{passive:true});target.addEventListener('touchmove',move,{passive:true});target.addEventListener('touchend',end,{passive:true});target.addEventListener('pointerdown',start);target.addEventListener('pointermove',move);target.addEventListener('pointerup',end);target.addEventListener('pointercancel',end)});
 }
 
 function escapeHtml(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 function close(){root&&(root.style.display='none');menu?.remove();sheet?.remove();menu=sheet=null;setZoom(1)}
 const obs=new MutationObserver(()=>requestAnimationFrame(()=>{studio()?refresh():close()}));
 addEventListener('DOMContentLoaded',()=>{ensure();obs.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});});
 globalThis.MSAOfficeMobile={refresh,setZoom,showMore};
})();