// Páginas estáticas /d/<id>/ para cada diario guardado, con su título, extracto, canonical
// e imagen 1200×630 propios (vista previa correcta en X, WhatsApp y buscadores), más el sitemap.
//
// Fuentes: la lista pública de diarios (función «lista» de Supabase) y, para cada uno, su JSON
// («page») y su tarjeta PNG («og»). Para no volver a pedirle todo a Supabase en cada build,
// primero se reutiliza lo ya publicado en el sitio (/d/<id>/pagina.json y /d/<id>/og.png).
//
// Variables (opcionales):
//   RB_DIARIOS=0               no arma páginas de diarios (solo sitemap con la portada)
//   RB_API                     base de las funciones (por defecto, la de src/lib/sitio.ts)
//   RB_PUBLICADO               sitio ya publicado del que reutilizar (por defecto, SITIO_POR_DEFECTO;
//                              «0» para no reutilizar)
//   RB_DIARIOS_OPCIONAL=1      si la lista no responde, seguir igual (en CI, por defecto, falla
//                              para no publicar un sitio sin las páginas que ya existían)
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ssr = await import(pathToFileURL(resolve(raiz, 'dist-ssr/entry-server.js')).href);
const { render, htmlDiario, metaDiario, sitemapXml, ID_VALIDO, parecePagina, SITIO_POR_DEFECTO, SUPABASE_FUNCTIONS_API } = ssr;

const env = process.env;
const API = (env.RB_API || SUPABASE_FUNCTIONS_API).replace(/\/+$/, '');
const PUBLICADO = env.RB_PUBLICADO === '0' ? null : (env.RB_PUBLICADO || SITIO_POR_DEFECTO).replace(/\/+$/, '');
const dist = resolve(raiz, 'dist');
const plantilla = readFileSync(resolve(dist, 'index.html'), 'utf8');
const hoy = new Date().toISOString().slice(0, 10);

async function pedir(url, tipo, ms = 20000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': 'rb-build' } });
    if (!r.ok) return null;
    return tipo === 'json' ? await r.json() : Buffer.from(await r.arrayBuffer());
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

const esPng = (b) => b && b.length > 1000 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

async function pagina(id) {
  if (PUBLICADO) {
    const p = await pedir(`${PUBLICADO}/d/${id}/pagina.json`, 'json');
    if (parecePagina(p) && p.id === id) return { p, de: 'publicado' };
  }
  const r = await pedir(`${API}/page?id=${encodeURIComponent(id)}`, 'json');
  return parecePagina(r?.pagina) && r.pagina.id === id ? { p: r.pagina, de: 'api' } : { p: null };
}

async function tarjeta(id) {
  if (PUBLICADO) {
    const b = await pedir(`${PUBLICADO}/d/${id}/og.png`, 'bin');
    if (esPng(b)) return b;
  }
  const b = await pedir(`${API}/og?id=${encodeURIComponent(id)}`, 'bin', 45000);
  return esPng(b) ? b : null;
}

async function enParalelo(xs, n, f) {
  const res = new Array(xs.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, xs.length) }, async () => {
      while (i < xs.length) {
        const k = i++;
        res[k] = await f(xs[k]);
      }
    })
  );
  return res;
}

const hechos = [];
let resumenes = [];
if (env.RB_DIARIOS !== '0') {
  const lista = await pedir(`${API}/lista`, 'json', 30000);
  if (!lista?.ok || !Array.isArray(lista.paginas)) {
    const msg = `diarios: no pude leer ${API}/lista`;
    if (env.CI && env.RB_DIARIOS_OPCIONAL !== '1') throw new Error(`${msg} (en CI no publico un sitio sin las páginas de diarios)`);
    console.warn(`${msg}; sigo sin páginas de diarios`);
  } else {
    resumenes = lista.paginas.filter((x) => typeof x?.id === 'string' && ID_VALIDO.test(x.id));
  }
}

const fallas = [];
const contados = { publicado: 0, api: 0 };
await enParalelo(resumenes, 4, async ({ id }) => {
  const { p, de } = await pagina(id);
  if (!p) return fallas.push(id);
  contados[de]++;
  const png = await tarjeta(id);
  const m = metaDiario(p, png ? {} : { imagen: `${SITIO_POR_DEFECTO}/og.png` });
  const dir = resolve(dist, 'd', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), htmlDiario(plantilla, p, render(p), m));
  writeFileSync(resolve(dir, 'pagina.json'), JSON.stringify(p));
  if (png) writeFileSync(resolve(dir, 'og.png'), png);
  hechos.push({ id, creada: p.creada, url: m.url, conImagen: Boolean(png) });
});

hechos.sort((a, b) => (a.creada < b.creada ? 1 : -1));
mkdirSync(resolve(dist, 'd'), { recursive: true });
// Índice público de lo publicado: lo usa el workflow programado para saber si hay diarios nuevos.
writeFileSync(
  resolve(dist, 'd', 'index.json'),
  JSON.stringify({ total: hechos.length, ids: hechos.map((h) => h.id), generado: new Date().toISOString() })
);
writeFileSync(
  resolve(dist, 'sitemap.xml'),
  sitemapXml([
    { url: `${SITIO_POR_DEFECTO}/`, lastmod: hechos[0]?.creada.slice(0, 10) ?? hoy, changefreq: 'weekly', priority: '0.8' },
    ...hechos.map((h) => ({ url: h.url, lastmod: h.creada.slice(0, 10), changefreq: 'yearly', priority: '0.6' })),
  ])
);
rmSync(resolve(raiz, 'dist-ssr'), { recursive: true, force: true });

const sinImg = hechos.filter((h) => !h.conImagen).length;
console.log(
  `diarios: ${hechos.length} páginas /d/<id>/ (${contados.publicado} reutilizadas del sitio, ${contados.api} pedidas a la API)` +
    (sinImg ? `, ${sinImg} con imagen de marca` : '') +
    (fallas.length ? `, ${fallas.length} sin datos: ${fallas.join(', ')}` : '')
);
