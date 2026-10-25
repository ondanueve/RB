// Inyecta el HTML prerenderizado de la portada en dist/index.html y precarga la fuente principal.
import { readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { render } = await import(pathToFileURL(resolve(raiz, 'dist-ssr/entry-server.js')).href);
const archivo = resolve(raiz, 'dist/index.html');
let html = readFileSync(archivo, 'utf8');
const marcador = '<div id="root"></div>';
if (!html.includes(marcador)) throw new Error('prerender: no encontré <div id="root"></div> en dist/index.html');
const cuerpo = render();
if (!cuerpo || cuerpo.length < 1000) throw new Error('prerender: el render quedó vacío');
html = html.replace(marcador, `<div id="root">${cuerpo}</div>`);

const fuentes = readdirSync(resolve(raiz, 'dist/assets')).filter((f) => /^eb-garamond-latin-400-normal.*\.woff2$/.test(f));
if (fuentes.length) {
  html = html.replace('</title>', `</title>\n    <link rel="preload" href="./assets/${fuentes[0]}" as="font" type="font/woff2" crossorigin />`);
}
writeFileSync(archivo, html);
rmSync(resolve(raiz, 'dist-ssr'), { recursive: true, force: true });
console.log(`prerender: ${cuerpo.length} caracteres en #root${fuentes.length ? ', fuente precargada' : ''}`);
