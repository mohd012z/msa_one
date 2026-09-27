package com.msa.one.displayfit37;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
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
    private static final int MAX_BITMAP_DIMENSION = 4096;
    private PdfRenderer renderer;
    private PdfRenderer.Page currentPage;
    private ParcelFileDescriptor descriptor;
    private ImageView image;
    private TextView pageLabel;
    private LinearLayout bar;
    private int pageIndex = 0;
    private float zoom = 1f;
    private float density = 1f;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        density = getResources().getDisplayMetrics().density;
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

    private int dp(int value) {
        return Math.round(value * density);
    }

    /** Mirrors MainActivity's own status/navigation-bar inset handling so the toolbar clears the real system bars on every device instead of guessing a fixed padding. */
    private void applySystemBarInsets(View root, View toolbar) {
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int top;
            int bottom;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                top = insets.getInsets(WindowInsets.Type.statusBars() | WindowInsets.Type.displayCutout()).top;
                bottom = insets.getInsets(WindowInsets.Type.navigationBars()).bottom;
            } else {
                top = insets.getSystemWindowInsetTop();
                bottom = insets.getSystemWindowInsetBottom();
            }
            toolbar.setPadding(toolbar.getPaddingLeft(), top + dp(8), toolbar.getPaddingRight(), dp(8));
            v.setPadding(v.getPaddingLeft(), 0, v.getPaddingRight(), bottom);
            return insets;
        });
        root.requestApplyInsets();
    }

    private void buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(8, 16, 29));

        bar = new LinearLayout(this);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(8), dp(8), dp(8), dp(8));
        bar.setBackgroundColor(Color.rgb(9, 18, 32));

        Button close = button("Close");
        Button prev = button("‹");
        Button next = button("›");
        Button minus = button("−");
        Button plus = button("+");
        pageLabel = new TextView(this);
        pageLabel.setTextColor(Color.rgb(234, 246, 255));
        pageLabel.setGravity(Gravity.CENTER);
        pageLabel.setPadding(dp(8), 0, dp(8), 0);
        pageLabel.setSingleLine(true);
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

        // Centers the page instead of letting it hug the top-left corner when it's
        // narrower than the screen, and lets both scroll directions work for zoomed pages.
        FrameLayout imageFrame = new FrameLayout(this);
        FrameLayout.LayoutParams imageParams = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        imageParams.gravity = Gravity.CENTER;
        imageFrame.addView(image, imageParams);

        HorizontalScrollView horizontal = new HorizontalScrollView(this);
        ScrollView vertical = new ScrollView(this);
        horizontal.addView(imageFrame, new HorizontalScrollView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        vertical.addView(horizontal, new ScrollView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.addView(vertical, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        setContentView(root);
        applySystemBarInsets(root, bar);
    }

    private Button button(String text) {
        Button b = new Button(this);
        b.setText(text);
        b.setAllCaps(false);
        b.setMinWidth(dp(44));
        b.setMinHeight(dp(44));
        return b;
    }

    private void renderPage() {
        if (renderer == null || renderer.getPageCount() == 0) return;
        if (currentPage != null) currentPage.close();
        currentPage = renderer.openPage(pageIndex);

        // PdfRenderer reports page size in PDF points (1/72in), not device pixels, so
        // rendering at that raw size makes the page look tiny on a modern high-density
        // screen. Scale it to fill the screen width first, then apply the user's zoom.
        DisplayMetrics metrics = getResources().getDisplayMetrics();
        float fitScale = metrics.widthPixels / (float) currentPage.getWidth();
        float scale = fitScale * zoom;

        int w = Math.min(MAX_BITMAP_DIMENSION, Math.max(1, Math.round(currentPage.getWidth() * scale)));
        int h = Math.min(MAX_BITMAP_DIMENSION, Math.max(1, Math.round(currentPage.getHeight() * scale)));
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
