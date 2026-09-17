#!/usr/bin/env bash
set -euo pipefail
APK="${1:-android/app/build/outputs/apk/debug/app-debug.apk}"
REPORT="${2:-agent-sahab-report.md}"
fail=0
check(){ local label="$1"; shift; if "$@" >/dev/null 2>&1; then echo "- [PASS] $label" >> "$REPORT"; else echo "- [FAIL] $label" >> "$REPORT"; fail=1; fi; }
cat > "$REPORT" <<EOF
# Agent Sahab — MSA One Android Audit

Build: ${GITHUB_SHA:-local}
APK: $APK

## APK integrity
EOF
check "APK exists and is non-empty" test -s "$APK"
if [[ -s "$APK" ]]; then
  echo "- SHA-256: \`$(sha256sum "$APK" | awk '{print $1}')\`" >> "$REPORT"
  echo "- Size: $(du -h "$APK" | awk '{print $1}')" >> "$REPORT"
fi
check "APK ZIP structure is readable" unzip -tq "$APK"
check "AndroidManifest.xml packaged" bash -c "unzip -l '$APK' | grep -q 'AndroidManifest.xml'"
check "classes.dex packaged" bash -c "unzip -l '$APK' | grep -q 'classes.dex'"
check "Capacitor web index packaged" bash -c "unzip -l '$APK' | grep -q 'assets/public/index.html'"
cat >> "$REPORT" <<'EOF'

## MSA One web/runtime contracts
EOF
check "Adaptive display width contract" grep -q -- '--msa-screen-width' android/app/src/main/assets/public/index.html
check "Visual viewport detection packaged" grep -q 'visualViewport' android/app/src/main/assets/public/index.html
check "Calendar packaged" grep -q 'data-calendar-home' android/app/src/main/assets/public/index.html
check "Shared project store packaged" grep -q 'MSAProjectStore' android/app/src/main/assets/public/index.html
check "Spreadsheet workspace packaged" grep -q 'renderSheet' android/app/src/main/assets/public/index.html
check "Presentation workspace packaged" grep -q 'renderSlides' android/app/src/main/assets/public/index.html
cat >> "$REPORT" <<'EOF'

## Android metadata
EOF
AAPT="$(find "$ANDROID_HOME/build-tools" -type f -name aapt -o -name aapt2 2>/dev/null | sort -V | tail -1 || true)"
if [[ -n "$AAPT" ]]; then
  "$AAPT" dump badging "$APK" > agent-sahab-badging.txt 2>/dev/null || true
  check "Expected application id" grep -q "package: name='com.msa.one.displayfit37'" agent-sahab-badging.txt
  check "Expected versionCode 37" grep -q "versionCode='37'" agent-sahab-badging.txt
else
  echo "- [WARN] Android aapt/aapt2 not found; metadata dump skipped" >> "$REPORT"
fi
cat >> "$REPORT" <<'EOF'

## Result
EOF
if [[ "$fail" -eq 0 ]]; then echo '**PASS — Agent Sahab found no blocking contract errors.**' >> "$REPORT"; exit 0; else echo '**FAIL — Agent Sahab found blocking errors. APK must not be promoted until corrected.**' >> "$REPORT"; exit 1; fi