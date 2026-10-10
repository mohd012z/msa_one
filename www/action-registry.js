(()=>{'use strict';
const REGISTRY=[
 {id:'studio-save',label:'Save',area:'Create Studio',selector:'[data-save],[data-bottom-save]',impl:'MSAStudio.saveDraft',state:'Available',destructive:false},
 {id:'studio-import',label:'Import',area:'Create Studio',selector:'[data-import],[data-bottom-import]',impl:'MSAStudio.importCurrent',state:'Available',destructive:false},
 {id:'studio-export',label:'Export',area:'Create Studio',selector:'[data-export],[data-bottom-export]',impl:'MSAStudio.exportCurrent',state:'Available',destructive:false},
 {id:'studio-close',label:'Close',area:'Create Studio',selector:'[data-close]',impl:'MSAStudio.close',state:'Available',destructive:false},
 {id:'files-open',label:'Open File',area:'Files',selector:'[data-import-file],[data-open-office]',impl:'MSAFiles.importOfficeFile',state:'Available',destructive:false},
 {id:'files-folder',label:'Import Folder',area:'Files',selector:'[data-import-folder],[data-open-folder]',impl:'MSAFiles.importFolder',state:'Available',destructive:false},
 {id:'project-open',label:'Open',area:'Files',selector:'[data-open]',impl:'MSAFiles.openProject',state:'Available',destructive:false},
 {id:'project-rename',label:'Rename',area:'Files',selector:'[data-more]',impl:'MSAFiles.renameProject',state:'Available',destructive:false},
 {id:'project-duplicate',label:'Duplicate',area:'Files',selector:'[data-more]',impl:'MSAFiles.duplicateProject',state:'Available',destructive:false},
 {id:'project-delete',label:'Delete',area:'Files',selector:'[data-more]',impl:'MSAFiles.deleteProject',state:'Available',destructive:true},
 {id:'workspace-backup',label:'Backup Workspace',area:'Settings',selector:'[data-msa-action="backup"]',impl:'MSAStorage.downloadBackup',state:'Available',destructive:false},
 {id:'workspace-restore',label:'Restore Backup',area:'Settings',selector:'[data-msa-action="restore"]',impl:'MSAStorage.importBackup',state:'Available',destructive:true},
 {id:'ai-reader',label:'Read Aloud',area:'AI/Tools',selector:'[data-msa-action="reader"]',impl:'MSAAIReader.open',state:'Available',destructive:false},
 {id:'create-document',label:'New Document',area:'Create Hub',selector:'[data-hub-action="document"]',impl:'MSAActionHub.run',state:'Available',destructive:false},
 {id:'create-scan',label:'Scan / Camera',area:'Create Hub',selector:'[data-hub-action="scan"]',impl:'MSAActionHub.run',state:'Available',destructive:false},
 {id:'global-search',label:'Search',area:'App Shell',selector:'[data-ws-search]',impl:'MSASearchCenter.open',state:'Available',destructive:false},
 {id:'open-myday',label:'My Day',area:'App Shell',selector:'[data-ws-nav="myday"]',impl:'MSAAppShell.open',state:'Available',destructive:false},
 {id:'present',label:'Present',area:'Office presentation',selector:'[data-action="present"]',impl:'MSAOfficeMobile.action',state:'Limited',destructive:false},
 {id:'slide-layout',label:'Layout',area:'Office presentation',selector:'[data-action="layout"]',impl:'MSAOfficeMobile.action',state:'Limited',destructive:false},
 {id:'pdf-edit',label:'Edit PDF Text',area:'Office PDF',selector:'[data-action="pdfedit"]',impl:'MSAOfficeMobile.action',state:'Limited',destructive:false},
 {id:'html-code',label:'Code',area:'Office Smart HTML',selector:'[data-action="code"]',impl:'MSAOfficeMobile.action',state:'Limited',destructive:false},
 {id:'html-preview',label:'Preview',area:'Office Smart HTML',selector:'[data-action="preview"]',impl:'MSAOfficeMobile.action',state:'Limited',destructive:false},
 {id:'sheet-autosum',label:'AutoSum',area:'Office spreadsheet',selector:'[data-action="sum"]',impl:'MSAOfficeMobile.action',state:'Limited',destructive:false}
];
function resolve(path){const parts=String(path||'').split('.');let value=globalThis;for(const part of parts)value=value?.[part];return value}
function audit(){return REGISTRY.map(entry=>{const implemented=typeof resolve(entry.impl)==='function';return{...entry,implemented,ok:entry.state==='Available'?implemented:true}})}
function find(id){return REGISTRY.find(x=>x.id===id)||null}
globalThis.MSAActionRegistry={list:Object.freeze(REGISTRY.map(x=>Object.freeze({...x}))),audit,find};
})();