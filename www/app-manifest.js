(()=> {
  const manifest={
    app:'MSA One',
    appId:'com.msa.one.displayfit37',
    version:'55.0.0',
    buildId:'MSA-ONE-55',
    channel:'built-in',
    dataSchema:1,
    librarySchema:2,
    updated:'2026-10-04',
    capabilities:[
      'library-auto-sync','library-update-history','preserve-user-library','built-in-capability-index','offline-template-library',
      'premium-prepared-inactive','force-update-policy-active','billing-bridge-template-prepared','security-hardening-v1','csp-enabled','android-webview-hardened',
      'native-office-fullscreen','pdf-import-viewer','explicit-save-controls','native-file-bridge','saf-folder-import','persisted-pdf-uri','native-downloads-save','android-system-bar-insets',
      'mobile-office-ribbon','pinch-zoom-workspace','full-page-office-view','workspace-ui-v2','universal-search','tools-center','template-center','workspace-drawer',
      'android-safe-area-css-bridge','office-swipe-down-sheet','organized-storage-section',
      'build55-unified-shell','build55-create-action-hub','build55-my-day-navigation','build55-search-command-center','build55-48px-touch-contract','build55-truthful-tool-states','build55-local-svg-icons'
    ]
  };
  globalThis.MSAAppManifest=Object.freeze(manifest);
})();