(()=>{'use strict';
const ROUTES={files:'files',storage:'me',planner:'myday',voice:'ai',ui:'me',performance:'me',premium:'premium'};
function shell(){return globalThis.MSAAppShell}
function install(){
 const lib=globalThis.MSALibrary;if(!lib||lib.__build55Shell)return false;lib.__build55Shell=true;
 const legacyOpen=lib.open?.bind(lib),legacyClose=lib.close?.bind(lib);
 lib.open=()=>shell()?.open?.('library')||legacyOpen?.();
 lib.close=()=>shell()?.open?.('home')||legacyClose?.();
 shell()?.registerPage?.({id:'library',title:'Library',parent:'home',render:()=>lib.render?.()});
 return true
}
function routeModule(id){
 if(ROUTES[id])return shell()?.open?.(ROUTES[id]);
 if(id==='updates'){const d=globalThis.MSAUpdatePolicy?.diagnostics?.();return globalThis.MSAHelper?.notify?.(d?('Update policy · '+(d.enabled===false?'disabled':'active')):'Update policy status unavailable.','info')}
 if(id==='security'){const d=globalThis.MSAMobileQuality?.securityCheck?.();return globalThis.MSAHelper?.notify?.(d?(d.status+' · security diagnostics'):'Security diagnostics unavailable.','info')}
 return null
}
function intercept(e){
 const back=e.target.closest?.('[data-library-back]');if(back){e.preventDefault();e.stopImmediatePropagation();shell()?.open?.('home');return}
 const shortcut=e.target.closest?.('[data-library-home],[data-library-me]');if(shortcut){e.preventDefault();e.stopImmediatePropagation();shell()?.open?.('library');return}
 const module=e.target.closest?.('#library [data-module]');if(!module)return;const id=module.dataset.module;if(!(id in ROUTES)&&!['updates','security'].includes(id))return;e.preventDefault();e.stopImmediatePropagation();routeModule(id)
}
if(typeof document!=='undefined'){document.addEventListener('click',intercept,true);document.addEventListener('DOMContentLoaded',()=>{install();setTimeout(install,250)});setTimeout(install,900)}
globalThis.MSALibraryShell={install,routeModule};
})();
