(()=> {
  const manifest={
    app:'MSA One',
    appId:'com.msa.one.displayfit37',
    version:'47.0.0',
    buildId:'MSA-ONE-47',
    channel:'built-in',
    dataSchema:1,
    librarySchema:2,
    updated:'2026-09-18',
    capabilities:[
      'library-auto-sync',
      'library-update-history',
      'preserve-user-library',
      'built-in-capability-index',
      'offline-template-library',
      'premium-prepared-inactive',
      'force-update-policy-prepared',
      'billing-bridge-template-prepared'
    ]
  };
  globalThis.MSAAppManifest=Object.freeze(manifest);
})();