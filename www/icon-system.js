(()=>{'use strict';
const PATHS={
  home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v-6h6v6"/>',
  files:'<path d="M3.5 6.5h6l2 2h9v11h-17z"/><path d="M3.5 6.5v-2h6l2 2"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M7 3v4M17 3v4M3.5 9h17"/>',
  ai:'<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  back:'<path d="m15 5-7 7 7 7"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  tools:'<path d="M14.7 6.3a4 4 0 0 0-5 5L4 17l3 3 5.7-5.7a4 4 0 0 0 5-5l-3 3-3-3z"/>',
  library:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M8 4v16"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.5 1a7 7 0 0 0-1.7-1L14.3 3h-4.6L9.3 6a7 7 0 0 0-1.7 1L5 6 3 9.4 5.1 11a7 7 0 0 0 0 2L3 14.6 5 18l2.6-1a7 7 0 0 0 1.7 1l.4 3h4.6l.4-3a7 7 0 0 0 1.7-1l2.6 1 2-3.4-2.1-1.6a7 7 0 0 0 .1-1z"/>',
  camera:'<path d="M4 8h4l1.5-2h5L16 8h4v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
  document:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h4M9 12h6M9 16h6"/>',
  spreadsheet:'<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 9h16M4 14h16M9 4v16M15 4v16"/>',
  presentation:'<rect x="4" y="4" width="16" height="12" rx="1"/><path d="M12 16v5M8 21h8M8 8h8M8 12h5"/>',
  pdf:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h4"/><path d="M8.5 16v-4h1.4a1.2 1.2 0 1 1 0 2.4H8.5M12 16v-4h1.3a2 2 0 0 1 0 4H12M16 16v-4h2"/>',
  html:'<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
  import:'<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19h16"/>',
  folder:'<path d="M3.5 7h7l2-2h8v14h-17z"/>',
  voice:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/>'
};
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function svg(id,{label='',className='msa-icon'}={}){
 const body=PATHS[id]||PATHS.more;
 const a11y=label?' role="img" aria-label="'+esc(label)+'"':' aria-hidden="true"';
 return '<svg class="'+esc(className)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'+a11y+'>'+body+'</svg>';
}
globalThis.MSAIcons={svg,has:id=>Object.hasOwn(PATHS,id),ids:Object.freeze(Object.keys(PATHS))};
})();
