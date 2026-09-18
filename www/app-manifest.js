(()=> {
  const manifest={
    app:'MSA One',
    version:'46.0.0',
    buildId:'MSA-ONE-46',
    channel:'built-in',
    dataSchema:1,
    librarySchema:2,
    updated:'2026-09-18',
    capabilities:[
      'library-auto-sync',
      'library-update-history',
      'preserve-user-library',
      'built-in-capability-index',
      'offline-template-library'
    ]
  };
  globalThis.MSAAppManifest=Object.freeze(manifest);
})();