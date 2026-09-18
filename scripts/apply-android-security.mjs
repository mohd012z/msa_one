import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),android=path.join(root,'android');
if(!fs.existsSync(android))throw new Error('Android project not found. Run cap add/sync first.');

const pkgDir=path.join(android,'app','src','main','java','com','msa','one','displayfit37');
fs.mkdirSync(pkgDir,{recursive:true});
const mainActivity=`package com.msa.one.displayfit37;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private void applySystemBarInsets(WebView webView) {
        webView.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override
            public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                int top;
                int bottom;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    top = insets.getInsets(
                        WindowInsets.Type.statusBars() | WindowInsets.Type.displayCutout()
                    ).top;
                    bottom = insets.getInsets(WindowInsets.Type.navigationBars()).bottom;
                } else {
                    top = insets.getSystemWindowInsetTop();
                    bottom = insets.getSystemWindowInsetBottom();
                }
                float density = getResources().getDisplayMetrics().density;
                final int topCss = Math.max(0, Math.round(top / density));
                final int bottomCss = Math.max(0, Math.round(bottom / density));
                webView.post(() -> webView.evaluateJavascript(
                    "document.documentElement.style.setProperty('--native-safe-top','" + topCss + "px');" +
                    "document.documentElement.style.setProperty('--native-safe-bottom','" + bottomCss + "px');",
                    null
                ));
                v.setPadding(0, 0, 0, 0);
                return insets;
            }
        });
        webView.requestApplyInsets();
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MSAFileBridgePlugin.class);
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
        applySystemBarInsets(webView);
        WebSettings settings = webView.getSettings();
        settings.setAllowFileAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setGeolocationEnabled(false);
        settings.setSaveFormData(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }
    }
}
`;
fs.writeFileSync(path.join(pkgDir,'MainActivity.java'),mainActivity);
fs.copyFileSync(
  path.join(root,'native-prep','android','MSAFileBridgePlugin.java'),
  path.join(pkgDir,'MSAFileBridgePlugin.java')
);

const resDir=path.join(android,'app','src','main','res','xml');
fs.mkdirSync(resDir,{recursive:true});
fs.copyFileSync(path.join(root,'security-prep','android','network_security_config.xml'),path.join(resDir,'network_security_config.xml'));

const manifest=path.join(android,'app','src','main','AndroidManifest.xml');
let m=fs.readFileSync(manifest,'utf8');
function setApplicationAttribute(xml,name,value){
  const re=new RegExp('android:'+name+'="[^"]*"');
  if(re.test(xml))return xml.replace(re,'android:'+name+'="'+value+'"');
  return xml.replace(/<application\b/,'<application android:'+name+'="'+value+'"');
}
m=setApplicationAttribute(m,'usesCleartextTraffic','false');
m=setApplicationAttribute(m,'networkSecurityConfig','@xml/network_security_config');
m=setApplicationAttribute(m,'allowBackup','false');
fs.writeFileSync(manifest,m);

console.log('Applied Android WebView/network security hardening.');
