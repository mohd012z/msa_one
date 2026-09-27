(()=>{'use strict';
  /**
   * Single source of truth for every primary action button in MSA One: its
   * name (as shown to the user), the selector(s) it's wired to, and exactly
   * which function implements it. Exists so "does the Save/Import/Export/…
   * button actually do what its label says" can be checked mechanically
   * (see tests/action-registry.test.mjs) instead of discovered by trial on
   * a device. Add a row here whenever a new named action button is added.
   */
  const REGISTRY=[
    {name:'Save',area:'Create Studio',selector:'[data-save],[data-bottom-save]',impl:'MSAStudio.saveDraft'},
    {name:'Import',area:'Create Studio',selector:'[data-import],[data-bottom-import]',impl:'MSAStudio.importCurrent'},
    {name:'Export',area:'Create Studio',selector:'[data-export],[data-bottom-export]',impl:'MSAStudio.exportCurrent'},
    {name:'Files',area:'Create Studio',selector:'[data-bottom-files]',impl:'MSAStudio.close+show(files)'},
    {name:'Close',area:'Create Studio',selector:'[data-close]',impl:'MSAStudio.close'},
    {name:'Open File',area:'Files',selector:'[data-open-office]',impl:'MSAFiles.importOfficeFile'},
    {name:'Import Folder',area:'Files',selector:'[data-open-folder]',impl:'MSAFiles.importFolder'},
    {name:'Re-scan',area:'Files',selector:'[data-rescan-folder]',impl:'MSAFiles.importFolder'},
    {name:'Open (project)',area:'Files',selector:'[data-open]',impl:'MSAFiles.openProject'},
    {name:'Rename',area:'Files',selector:'[data-rename]',impl:'MSAFiles.renameProject'},
    {name:'Duplicate',area:'Files',selector:'[data-copy]',impl:'MSAFiles.duplicateProject'},
    {name:'Delete',area:'Files',selector:'[data-delete]',impl:'MSAFiles.deleteProject'},
    {name:'Backup Workspace',area:'Me',selector:'[data-msa-action="backup"]',impl:'MSAStorage.downloadBackup'},
    {name:'Restore Backup',area:'Me',selector:'[data-msa-action="restore"]',impl:'MSAStorage.importBackup'},
    {name:'AI Reader & Presenter',area:'Home/Premium',selector:'[data-msa-action="reader"],[data-msa-action="presenter"]',impl:'MSAAIReader.open'},
    {name:'Present',area:'Office ribbon (presentation)',selector:'ribbon tool "present"',impl:'office-mobile.js presentSlides'},
    {name:'Layout',area:'Office ribbon (presentation)',selector:'ribbon tool "layout"',impl:'office-mobile.js action() [data-slide-layout]'},
    {name:'Edit',area:'Office ribbon (PDF)',selector:'ribbon tool "pdfedit"',impl:'office-mobile.js action() [data-pdf-text]'},
    {name:'Code',area:'Office ribbon (Smart HTML)',selector:'ribbon tool "code"',impl:'office-mobile.js action() [data-code]'},
    {name:'Preview',area:'Office ribbon (Smart HTML)',selector:'ribbon tool "preview"',impl:'office-mobile.js action() [data-preview]'},
    {name:'AutoSum',area:'Office ribbon (spreadsheet)',selector:'ribbon tool "sum"',impl:'office-mobile.js action() [data-cell]'}
  ];
  function resolve(path){
    return path.split(/[.+]/)[0].split('.').reduce((o,k)=>o?.[k],globalThis);
  }
  /** Returns each entry plus whether its implementation actually resolves to a real function at runtime. */
  function audit(){
    return REGISTRY.map(entry=>{
      const rootName=entry.impl.split('.')[0];
      const root=globalThis[rootName];
      const member=entry.impl.includes('.')?entry.impl.split('.')[1].split('+')[0]:null;
      const ok=member?typeof root?.[member]==='function':typeof root!=='undefined';
      return{...entry,ok};
    });
  }
  globalThis.MSAActionRegistry={list:REGISTRY,audit};
})();
