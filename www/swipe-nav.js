(()=>{'use strict';
  const ORDER=['home','files','create','tools','ai'];
  const THRESHOLD=64,MAX_ANGLE=0.62,MAX_DURATION=650;
  let sx=0,sy=0,st=0,tracking=false,ignore=false;

  function studioOpen(){return!!document.querySelector('.studio-overlay.on')}
  function currentPage(){return document.querySelector('.page.on')}
  function currentIndex(){const p=currentPage();return p?ORDER.indexOf(p.id):-1}
  function interactiveTarget(t){
    return!!t.closest('input,textarea,select,[contenteditable="true"],.studio-overlay,#lens,.nav,iframe,.helper-sheet,.action-sheet,.drawer,[data-swipe-ignore]');
  }
  function atTop(page){return page.scrollTop<=1}
  function atBottom(page){return page.scrollTop+page.clientHeight>=page.scrollHeight-1}

  function onStart(e){
    if(studioOpen()){ignore=true;return}
    const t=e.touches[0];
    if(interactiveTarget(e.target)){ignore=true;return}
    ignore=false;tracking=true;sx=t.clientX;sy=t.clientY;st=Date.now();
  }
  function onMove(e){
    if(!tracking||ignore)return;
    const t=e.touches[0],dx=t.clientX-sx,dy=t.clientY-sy;
    if(Math.abs(dy)>18&&Math.abs(dx)<Math.abs(dy)*MAX_ANGLE){
      const page=currentPage();
      if(!page)return;
      if((dy<0&&atBottom(page))||(dy>0&&atTop(page)))e.preventDefault();
    }
  }
  function onEnd(e){
    if(!tracking||ignore){tracking=false;return}
    tracking=false;
    const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy,dt=Date.now()-st;
    if(dt>MAX_DURATION)return;
    if(Math.abs(dy)<THRESHOLD)return;
    if(Math.abs(dx)>Math.abs(dy)*MAX_ANGLE)return;
    const page=currentPage();if(!page)return;
    const idx=ORDER.indexOf(page.id);if(idx<0)return;
    if(dy<0){
      if(!atBottom(page))return;
      const next=ORDER[idx+1];if(next)go(next);
    }else{
      if(!atTop(page))return;
      const prev=ORDER[idx-1];if(prev)go(prev);
    }
  }
  function go(id){
    if(globalThis.MSAAppShell?.open)globalThis.MSAAppShell.open(id);
    else if(typeof window.show==='function')window.show(id);
  }

  document.addEventListener('touchstart',onStart,{passive:true});
  document.addEventListener('touchmove',onMove,{passive:false});
  document.addEventListener('touchend',onEnd,{passive:true});
  document.addEventListener('touchcancel',()=>{tracking=false},{passive:true});

  globalThis.MSASwipeNav={order:ORDER,currentIndex};
})();
