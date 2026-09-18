package com.msa.one.displayfit37;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.MimeTypeMap;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "MSAFileBridge")
public class MSAFileBridgePlugin extends Plugin {
    private static final String PREFS = "msa_native_files";
    private static final String FOLDER_KEY = "folder_uri";
    private static final long MAX_READ_BYTES = 32L * 1024L * 1024L;
    private static final int MAX_FOLDER_FILES = 1000;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void status(PluginCall call) {
        JSObject out = new JSObject();
        out.put("available", true);
        out.put("folderPersisted", !savedFolderUri().isEmpty());
        out.put("maxReadBytes", MAX_READ_BYTES);
        out.put("maxFolderFiles", MAX_FOLDER_FILES);
        call.resolve(out);
    }

    @PluginMethod
    public void pickFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION |
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION |
            Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
        );
        startActivityForResult(call, intent, "folderPicked");
    }

    @ActivityCallback
    private void folderPicked(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.resolve(new JSObject().put("cancelled", true));
            return;
        }
        Uri treeUri = result.getData().getData();
        final int takeFlags = result.getData().getFlags() &
            (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        try {
            getContext().getContentResolver().takePersistableUriPermission(treeUri, takeFlags);
        } catch (Exception ignored) {}
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(FOLDER_KEY, treeUri.toString()).apply();
        scanTreeAsync(call, treeUri);
    }

    @PluginMethod
    public void rescanFolder(PluginCall call) {
        String saved = savedFolderUri();
        if (saved.isEmpty()) {
            call.reject("NO_PERSISTED_FOLDER");
            return;
        }
        scanTreeAsync(call, Uri.parse(saved));
    }

    @PluginMethod
    public void clearFolder(PluginCall call) {
        String saved = savedFolderUri();
        if (!saved.isEmpty()) {
            try {
                getContext().getContentResolver().releasePersistableUriPermission(
                    Uri.parse(saved),
                    Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                );
            } catch (Exception ignored) {}
        }
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(FOLDER_KEY).apply();
        call.resolve();
    }

    @PluginMethod
    public void readUri(PluginCall call) {
        String uriText = call.getString("uri", "");
        if (uriText.isEmpty()) {
            call.reject("URI_REQUIRED");
            return;
        }
        executor.execute(() -> {
            try {
                Uri uri = Uri.parse(uriText);
                JSObject meta = metadata(uri);
                long knownSize = meta.getLong("size", -1L);
                if (knownSize > MAX_READ_BYTES) throw new IllegalStateException("FILE_TOO_LARGE");

                ContentResolver resolver = getContext().getContentResolver();
                try (InputStream in = resolver.openInputStream(uri);
                     ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                    if (in == null) throw new IllegalStateException("Unable to open selected file");
                    byte[] buf = new byte[65536];
                    long total = 0;
                    int n;
                    while ((n = in.read(buf)) != -1) {
                        total += n;
                        if (total > MAX_READ_BYTES) throw new IllegalStateException("FILE_TOO_LARGE");
                        out.write(buf, 0, n);
                    }
                    meta.put("size", total);
                    meta.put("base64", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
                }
                resolveOnUi(call, meta);
            } catch (Exception e) {
                rejectOnUi(call, "READ_FAILED", e.getMessage());
            }
        });
    }

    @PluginMethod
    public void saveFile(PluginCall call) {
        String name = sanitizeFileName(call.getString("name", "MSA-One-file.bin"));
        String mime = call.getString("mimeType", inferMime(name));
        String base64 = call.getString("base64", "");
        if (base64.isEmpty()) {
            call.reject("BASE64_REQUIRED");
            return;
        }
        executor.execute(() -> {
            try {
                byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
                if (bytes.length > MAX_READ_BYTES) throw new IllegalStateException("FILE_TOO_LARGE");
                Uri uri = saveToDownloads(name, mime, bytes);
                JSObject out = new JSObject();
                out.put("saved", uri != null);
                out.put("name", name);
                out.put("uri", uri == null ? "" : uri.toString());
                out.put("location", "Downloads/MSA One");
                resolveOnUi(call, out);
            } catch (Exception e) {
                rejectOnUi(call, "SAVE_FAILED", e.getMessage());
            }
        });
    }

    private void scanTreeAsync(PluginCall call, Uri treeUri) {
        executor.execute(() -> {
            try {
                JSArray files = new JSArray();
                String treeId = DocumentsContract.getTreeDocumentId(treeUri);
                collectTreeFiles(treeUri, treeId, "", files);
                JSObject out = new JSObject();
                out.put("cancelled", false);
                out.put("treeUri", treeUri.toString());
                out.put("count", files.length());
                out.put("files", files);
                out.put("truncated", files.length() >= MAX_FOLDER_FILES);
                resolveOnUi(call, out);
            } catch (Exception e) {
                rejectOnUi(call, "FOLDER_SCAN_FAILED", e.getMessage());
            }
        });
    }

    private void collectTreeFiles(Uri treeUri, String parentDocumentId, String parentPath, JSArray out) {
        if (out.length() >= MAX_FOLDER_FILES) return;
        Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, parentDocumentId);
        String[] projection = {
            DocumentsContract.Document.COLUMN_DOCUMENT_ID,
            DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE,
            DocumentsContract.Document.COLUMN_SIZE
        };
        try (Cursor c = getContext().getContentResolver().query(children, projection, null, null, null)) {
            if (c == null) return;
            while (c.moveToNext() && out.length() < MAX_FOLDER_FILES) {
                String docId = c.getString(0);
                String name = c.getString(1);
                String mime = c.getString(2);
                long size = c.isNull(3) ? -1L : c.getLong(3);
                String rel = parentPath.isEmpty() ? safeSegment(name) : parentPath + "/" + safeSegment(name);
                if (DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)) {
                    collectTreeFiles(treeUri, docId, rel, out);
                } else if (isSupportedFile(name, mime)) {
                    Uri docUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, docId);
                    JSObject item = new JSObject();
                    item.put("uri", docUri.toString());
                    item.put("name", name == null ? "file" : name);
                    item.put("relativePath", rel);
                    item.put("mimeType", mime == null ? inferMime(name) : mime);
                    item.put("size", size);
                    out.put(item);
                }
            }
        }
    }

    private JSObject metadata(Uri uri) {
        JSObject out = new JSObject();
        out.put("uri", uri.toString());
        out.put("name", "file");
        out.put("mimeType", "application/octet-stream");
        out.put("size", -1L);
        String[] projection = {
            DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE,
            DocumentsContract.Document.COLUMN_SIZE
        };
        try (Cursor c = getContext().getContentResolver().query(uri, projection, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                String name = c.getString(0);
                String mime = c.getString(1);
                long size = c.isNull(2) ? -1L : c.getLong(2);
                out.put("name", name == null ? "file" : name);
                out.put("mimeType", mime == null ? inferMime(name) : mime);
                out.put("size", size);
            }
        } catch (Exception ignored) {}
        return out;
    }

    private Uri saveToDownloads(String name, String mimeType, byte[] bytes) throws Exception {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            throw new IllegalStateException("Android 10 or newer is required for native Downloads export");
        }
        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, name);
        values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/MSA One");
        values.put(MediaStore.Downloads.IS_PENDING, 1);
        Uri collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        Uri uri = getContext().getContentResolver().insert(collection, values);
        if (uri == null) return null;
        try {
            try (OutputStream stream = getContext().getContentResolver().openOutputStream(uri, "w")) {
                if (stream == null) throw new IllegalStateException("Unable to open Downloads output stream");
                stream.write(bytes);
                stream.flush();
            }
            values.clear();
            values.put(MediaStore.Downloads.IS_PENDING, 0);
            getContext().getContentResolver().update(uri, values, null, null);
            return uri;
        } catch (Exception error) {
            try { getContext().getContentResolver().delete(uri, null, null); } catch (Exception ignored) {}
            throw error;
        }
    }

    private boolean isSupportedFile(String name, String mime) {
        String n = name == null ? "" : name.toLowerCase(Locale.ROOT);
        String[] ext = {
            ".pdf", ".docx", ".xlsx", ".xlsm", ".pptx", ".csv", ".tsv",
            ".txt", ".rtf", ".html", ".htm", ".png", ".jpg", ".jpeg",
            ".tif", ".tiff", ".bmp", ".webp", ".svg"
        };
        for (String e : ext) if (n.endsWith(e)) return true;
        return mime != null && (mime.startsWith("image/") || mime.equals("application/pdf") || mime.startsWith("text/"));
    }

    private String savedFolderUri() {
        return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(FOLDER_KEY, "");
    }

    private static String safeSegment(String name) {
        String s = name == null ? "file" : name.replace("/", "_").replace("\\", "_").trim();
        return s.isEmpty() ? "file" : s;
    }

    private static String sanitizeFileName(String name) {
        String cleaned = name == null ? "MSA-One-file.bin" : name.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_").trim();
        return cleaned.isEmpty() ? "MSA-One-file.bin" : cleaned;
    }

    private static String inferMime(String name) {
        String n = name == null ? "" : name;
        String extension = MimeTypeMap.getFileExtensionFromUrl(n.toLowerCase(Locale.ROOT));
        String mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
        return mime == null ? "application/octet-stream" : mime;
    }

    private void resolveOnUi(PluginCall call, JSObject value) {
        Activity activity = getActivity();
        if (activity != null) activity.runOnUiThread(() -> call.resolve(value));
        else call.resolve(value);
    }

    private void rejectOnUi(PluginCall call, String code, String message) {
        Activity activity = getActivity();
        Runnable r = () -> call.reject(message == null ? code : message, code);
        if (activity != null) activity.runOnUiThread(r);
        else r.run();
    }
}
