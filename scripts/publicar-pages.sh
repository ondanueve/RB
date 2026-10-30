#!/usr/bin/env bash
# Publica el sitio estático en https://ondanueve.github.io/RB/ (GitHub Pages desde la rama gh-pages).
# Corre tests, arma out/ y sube un commit nuevo a gh-pages (sin force-push ni reescribir historia).
# Uso: scripts/publicar-pages.sh
set -euo pipefail
cd "$(dirname "$0")/.."
REMOTE="$(git remote get-url origin)"
SHA="$(git rev-parse --short HEAD)"
npm test
npm run build
printf '{"rb":"%s","built_at":"%s"}\n' "$(git rev-parse HEAD)" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > out/build.json
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
if git ls-remote --exit-code --heads origin gh-pages >/dev/null 2>&1; then
  git clone -q --branch gh-pages --single-branch "$REMOTE" "$TMP"
else
  git init -q -b gh-pages "$TMP"
  git -C "$TMP" remote add origin "$REMOTE"
fi
find "$TMP" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r out/. "$TMP"/
touch "$TMP/.nojekyll"
git -C "$TMP" add -A
if git -C "$TMP" diff --cached --quiet; then echo "sin cambios para publicar"; exit 0; fi
git -C "$TMP" commit -q -m "Publicación de $SHA"
git -C "$TMP" push -q origin gh-pages
echo "publicado $SHA en gh-pages -> https://ondanueve.github.io/RB/"
