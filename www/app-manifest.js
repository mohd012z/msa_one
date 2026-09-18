(()=> {
  const manifest={
    app:'MSA One',
    appId:'com.msa.one.displayfit37',
    version:'52.0.0',
    buildId:'MSA-ONE-52',
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
      'force-update-policy-active',
      'billing-bridge-template-prepared',
      'security-hardening-v1',
      'csp-enabled',
      'android-webview-hardened',
      'native-office-fullscreen',
      'pdf-import-viewer',
      'explicit-save-controls',
      'standard-button-sizing',
      'native-file-bridge',
      'saf-folder-import',
      'persisted-pdf-uri',
      'native-downloads-save',
      'android-system-bar-insets',
      'mobile-office-ribbon',
      'pinch-zoom-workspace',
      'full-page-office-view'
    ]
  };
  globalThis.MSAAppManifest=Object.freeze(manifest);
})();