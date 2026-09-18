import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),android=path.join(root,'android');
if(!fs.existsSync(android))throw new Error('Android project not found. Run cap add/sync first.');

const pkgDir=path.join(android,'app','src','main','java','com','msa','one','displayfit37');
fs.mkdirSync(pkgDir,{recursive:true});
const mainActivity=`package com.msa.one.displayfit37;

import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
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
