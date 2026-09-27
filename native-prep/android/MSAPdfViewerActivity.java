package com.msa.one.displayfit37;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.net.Uri;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

/**
 * Renders PDF pages natively via android.graphics.pdf.PdfRenderer. Android's WebView has no
 * built-in PDF plugin, so a blob: URL dropped into an <iframe> inside the web app renders
 * blank on-device even though the same page works in a desktop browser. This Activity bypasses
 * the WebView entirely for PDF display, so it renders correctly regardless of WebView version
 * and for both text and scanned/image-only PDFs. Launched from JS via
 * MSAFileBridgePlugin.openPdfViewer({uri}) -> MSANativeFiles.openPdfViewer(uri).
 */
public class MSAPdfViewerActivity extends Activity {
    private PdfRenderer renderer;
    private PdfRenderer.Page currentPage;
    private ParcelFileDescriptor descriptor;
    private ImageView image;
    private TextView pageLabel;
    private int pageIndex = 0;
    private float zoom = 1f;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        buildUi();
        String source = getIntent().getStringExtra("pdf_source");
        if (source == null || source.isEmpty()) {
            Toast.makeText(this, "No PDF source was provided.", Toast.LENGTH_LONG).show();
            finish();
            return;
        }
        try {
            Uri uri = Uri.parse(source);
            descriptor = getContentResolver().openFileDescriptor(uri, "r");
            if (descriptor == null) throw new IllegalStateException("Could not open PDF for reading.");
            renderer = new PdfRenderer(descriptor);
            if (renderer.getPageCount() == 0) throw new IllegalStateException("This PDF has no pages.");
            renderPage();
        } catch (Exception e) {
            Toast.makeText(this, "Cannot open PDF: " + e.getMessage(), Toast.LENGTH_LONG).show();
            finish();
        }
    }

    private void buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(8, 16, 29));

        LinearLayout bar = new LinearLayout(this);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(12, 12, 12, 12);
        bar.setBackgroundColor(Color.rgb(9, 18, 32));

        Button close = button("Close");
        Button prev = button("‹");
        Button next = button("›");
        Button minus = button("−");
        Button plus = button("+");
        pageLabel = new TextView(this);
        pageLabel.setTextColor(Color.rgb(234, 246, 255));
        pageLabel.setPadding(20, 0, 20, 0);
        LinearLayout.LayoutParams grow = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);

        close.setOnClickListener(v -> finish());
        prev.setOnClickListener(v -> { if (pageIndex > 0) { pageIndex--; renderPage(); } });
        next.setOnClickListener(v -> { if (renderer != null && pageIndex < renderer.getPageCount() - 1) { pageIndex++; renderPage(); } });
        minus.setOnClickListener(v -> { zoom = Math.max(0.5f, zoom - 0.25f); renderPage(); });
        plus.setOnClickListener(v -> { zoom = Math.min(4f, zoom + 0.25f); renderPage(); });

        bar.addView(close);
        bar.addView(prev);
        bar.addView(pageLabel, grow);
        bar.addView(next);
        bar.addView(minus);
        bar.addView(plus);
        root.addView(bar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        image = new ImageView(this);
        image.setAdjustViewBounds(true);
        image.setBackgroundColor(Color.WHITE);

        HorizontalScrollView horizontal = new HorizontalScrollView(this);
        ScrollView vertical = new ScrollView(this);
        horizontal.addView(image, new HorizontalScrollView.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        vertical.addView(horizontal, new ScrollView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        root.addView(vertical, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        setContentView(root);
    }

    private Button button(String text) {
        Button b = new Button(this);
        b.setText(text);
        b.setAllCaps(false);
        return b;
    }

    private void renderPage() {
        if (renderer == null || renderer.getPageCount() == 0) return;
        if (currentPage != null) currentPage.close();
        currentPage = renderer.openPage(pageIndex);
        int w = Math.max(1, (int) (currentPage.getWidth() * zoom));
        int h = Math.max(1, (int) (currentPage.getHeight() * zoom));
        Bitmap bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        bitmap.eraseColor(Color.WHITE);
        currentPage.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
        image.setImageBitmap(bitmap);
        pageLabel.setText("Page " + (pageIndex + 1) + " / " + renderer.getPageCount());
    }

    @Override
    protected void onDestroy() {
        if (currentPage != null) currentPage.close();
        if (renderer != null) renderer.close();
        try {
            if (descriptor != null) descriptor.close();
        } catch (Exception ignored) {}
        super.onDestroy();
    }
}
