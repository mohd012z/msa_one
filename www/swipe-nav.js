(()=>{'use strict';
  const ORDER=['home','files','myday','ai'];
  const THRESHOLD=64,MAX_ANGLE=0.62,MAX_DURATION=650;
  let sx=0,sy=0,st=0,tracking=false,ignore=false;
  function order(){return globalThis.MSAAppShell?.primaryDestinations?.()||ORDER}
  function studioOpen(){return!!document.querySelector('.studio-overlay.on')}
  function currentPage(){return document.querySelector('.page.on')}
  function currentId(){const id=currentPage()?.id;return id==='planner'?'myday':id}
  function currentIndex(){return order().indexOf(currentId())}
  function interactiveTarget(t){return!!t.closest('input,textarea,select,[contenteditable="true"],.studio-overlay,#lens,.ws-bottom,iframe,.helper-sheet,.action-sheet,.ws-drawer,.ws-search-panel,.msa-action-hub,.office-more-sheet,.office-tab-menu,.ai-reader-overlay,.office-present-overlay,[data-swipe-ignore]')}
  function atTop(page){return page.scrollTop<=1}
  function atBottom(page){return page.scrollTop+page.clientHeight>=page.scrollHeight-1}
  function onStart(e){if(studioOpen()){ignore=true;return}const t=e.touches[0];if(interactiveTarget(e.target)){ignore=true;return}ignore=false;tracking=true;sx=t.clientX;sy=t.clientY;st=Date.now()}
  function onMove(e){if(!tracking||ignore)return;const t=e.touches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dy)>18&&Math.abs(dx)<Math.abs(dy)*MAX_ANGLE){const page=currentPage();if(!page)return;if((dy<0&&atBottom(page))||(dy>0&&atTop(page)))e.preventDefault()}}
  function onEnd(e){if(!tracking||ignore){tracking=false;return}tracking=false;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy,dt=Date.now()-st;if(dt>MAX_DURATION||Math.abs(dy)<THRESHOLD||Math.abs(dx)>Math.abs(dy)*MAX_ANGLE)return;const page=currentPage();if(!page)return;const list=order(),idx=list.indexOf(currentId());if(idx<0)return;if(dy<0){if(!atBottom(page))return;const next=list[idx+1];if(next)go(next)}else{if(!atTop(page))return;const prev=list[idx-1];if(prev)go(prev)}}
  function go(id){if(globalThis.MSAAppShell?.open)globalThis.MSAAppShell.open(id);else if(typeof window.show==='function')window.show(id)}
  document.addEventListener('touchstart',onStart,{passive:true});document.addEventListener('touchmove',onMove,{passive:false});document.addEventListener('touchend',onEnd,{passive:true});document.addEventListener('touchcancel',()=>{tracking=false},{passive:true});
  globalThis.MSASwipeNav={order,currentIndex};
})();