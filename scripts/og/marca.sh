#!/usr/bin/env bash
# Regenera public/og.png (imagen de marca para compartir, 1200×630) desde scripts/og/marca.html.
# Necesita Chrome/Chromium y node_modules instalado (usa la EB Garamond de @fontsource).
set -euo pipefail
cd "$(dirname "$0")/../.."
CHROME="${CHROME:-$(command -v google-chrome || command -v chromium || command -v chromium-browser)}"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --allow-file-access-from-files --virtual-time-budget=3000 \
  --window-size=1200,630 --screenshot="$PWD/public/og.png" "file://$PWD/scripts/og/marca.html"
echo "public/og.png listo"
