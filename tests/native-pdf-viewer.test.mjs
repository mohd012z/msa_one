import fs from 'node:fs';
import assert from 'node:assert/strict';

// Android WebView has no built-in PDF plugin — a blob: URL dropped into an <iframe> (the
// previous approach) renders blank on real devices even though it works in a desktop
// browser, which is very likely the real reason PDFs "still won't open" on-device. This
// verifies the full chain of the real fix: a native android.graphics.pdf.PdfRenderer
// Activity, a Capacitor plugin method to launch it, the JS wrapper, the build script that
// wires it into the generated Android project, and the Create Studio UI that uses it.

const activity=fs.readFileSync('native-prep/android/MSAPdfViewerActivity.java','utf8');
assert.ok(activity.includes('import android.graphics.pdf.PdfRenderer;'),'must use the real native Android PDF renderer, not a fake/placeholder');
assert.ok(activity.includes('extends Activity'),'must be a real Activity, launchable via Intent');
assert.ok(activity.includes('renderer.openPage'),'must actually render PDF pages, not just show metadata');
assert.ok(activity.includes('onDestroy')&&activity.includes('renderer.close()'),'must release the PdfRenderer/ParcelFileDescriptor to avoid leaking native resources');
assert.ok(activity.includes('setOnApplyWindowInsetsListener'),'the viewer\'s toolbar must clear the real status bar via window insets, not a fixed padding guess — otherwise it overlaps the status bar exactly like the old bug');
assert.ok(!/setPadding\(12, ?12, ?12, ?12\)/.test(activity),'toolbar padding must not be a raw un-scaled pixel guess independent of the status bar inset');
assert.ok(activity.includes('metrics.widthPixels')&&activity.includes('fitScale'),'PdfRenderer reports page size in PDF points, not device pixels — pages must be scaled to the real screen width or they render tiny in a corner');
assert.ok(activity.includes('MAX_BITMAP_DIMENSION'),'zoomed bitmap dimensions must be capped to avoid an oversized-bitmap crash at high zoom');
assert.ok(activity.includes('Gravity.CENTER')&&activity.includes('FrameLayout'),'the rendered page must be centered in the viewport, not left pinned to the top-left corner');

const plugin=fs.readFileSync('native-prep/android/MSAFileBridgePlugin.java','utf8');
assert.ok(plugin.includes('public void openPdfViewer(PluginCall call)'),'Capacitor plugin must expose openPdfViewer');
assert.ok(plugin.includes('new Intent(activity, MSAPdfViewerActivity.class)'),'openPdfViewer must actually launch the native PDF Activity');

const jsBridge=fs.readFileSync('www/native-file-bridge.js','utf8');
assert.ok(jsBridge.includes('async function openPdfViewer(uri)'),'JS bridge must expose openPdfViewer');
assert.ok(jsBridge.includes('p.openPdfViewer({uri})'),'JS bridge must call the real Capacitor plugin method');
assert.ok(jsBridge.includes('openPdfViewer'),'openPdfViewer must be exported on globalThis.MSANativeFiles');
assert.ok(/globalThis\.MSANativeFiles=\{[^}]*openPdfViewer/.test(jsBridge),'openPdfViewer must actually be exported, not just defined');

const script=fs.readFileSync('scripts/apply-android-security.mjs','utf8');
assert.ok(script.includes("'MSAPdfViewerActivity.java'"),'build script must copy the native PDF viewer into the generated Android project');
assert.ok(script.includes('MSAPdfViewerActivity')&&script.includes('</application>'),'build script must register the Activity in AndroidManifest.xml');

const studio=fs.readFileSync('www/create-studio.js','utf8');
assert.ok(studio.includes('MSANativeFiles.openPdfViewer'),'Create Studio PDF view must use the native viewer when running natively');
assert.ok(studio.includes('canNative')&&studio.includes('MSANativeFiles?.isNative?.()'),'Create Studio must detect native mode to decide between the native viewer and the iframe fallback');
assert.ok(studio.includes('saveBlob'),'a freshly imported/created PDF (blob: URL) must be persisted to a real file before the native viewer (which needs a real content://\\/file:// URI) can open it');

const ci=fs.readFileSync('.github/workflows/build-apk.yml','utf8');
assert.ok(ci.includes('MSAPdfViewerActivity.java')&&ci.includes('PdfRenderer'),'CI must verify the native PDF viewer source is present before packaging');
assert.ok(/grep -q 'MSAPdfViewerActivity' android\/app\/src\/main\/AndroidManifest\.xml/.test(ci),'CI must verify the Activity is actually registered in the built manifest, not just copied');

console.log('native PDF viewer (Android PdfRenderer, replacing the broken WebView iframe) contract passed');
