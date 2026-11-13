/**
 * Vista previa propia para cada diario: URL estática /d/<id>/, metadatos y HTML de la página.
 * Lo usan el cliente (enlace para compartir, canonical) y el build (scripts/diarios.mjs),
 * que escribe out/d/<id>/index.html para que X, WhatsApp y buscadores lean la ficha correcta
 * sin ejecutar JavaScript. Sin DOM: solo cadenas, para poder probarlo en node.
 */
import type { PaginaPublica } from './storage/tipos';
import { ID_VALIDO } from './storage/tipos';
import { MARCA, NOMBRE_SITIO, SITIO_POR_DEFECTO } from './sitio';
import { repartoDe } from './paginas';

/** Imagen de marca genérica (portada y diarios sin imagen propia), 1200×630. */
export const OG_MARCA = `${SITIO_POR_DEFECTO}/og.png`;
export const LEMA = 'Creador de diarios apócrifos.';

/** Las páginas de muestra viven en el bundle (antologia.json) y no tienen ruta /d/. */
export function esDemo(id: string): boolean {
  return /^demo\d+borges$/.test(id);
}

/** Enlace público de un diario: /d/<id>/ para los generados, ?id= para los de muestra. */
export function urlDiario(id: string, sitio = SITIO_POR_DEFECTO): string {
  const base = sitio.replace(/\/+$/, '');
  return esDemo(id) || !ID_VALIDO.test(id)
    ? `${base}/?id=${encodeURIComponent(id)}`
    : `${base}/d/${id}/`;
}

export interface MetaDiario {
  titulo: string;
  /** Título sin el nombre del sitio (og:title, tarjetas). */
  tituloCorto: string;
  descripcion: string;
  url: string;
  imagen: string;
  imagenAlt: string;
}

function nombres(p: PaginaPublica) {
  return {
    borges: p.validacion?.borges?.nombre || p.parametros.borges,
    bioy: p.validacion?.bioy?.nombre || p.parametros.bioy,
  };
}

/** «Lionel Scaloni, según Pablo Aimar: dos páginas del diario apócrifo». */
export function tituloDiario(p: PaginaPublica): string {
  const { borges, bioy } = nombres(p);
  const dos = repartoDe(p.entrada).length > 1;
  return `${borges}, según ${bioy}: ${dos ? 'dos páginas' : 'una página'} del diario apócrifo`;
}

/** Extracto de la primera entrada, de 155 caracteres como mucho. */
export function extractoDiario(p: PaginaPublica, max = 155): string {
  const d = p.entrada.dias[0];
  if (!d) return LEMA;
  const t = `${d.encabezado} ${d.situacion} ${d.parrafos.join(' ')}`.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const corte = t.slice(0, max - 1);
  const espacio = corte.lastIndexOf(' ');
  return `${(espacio > max * 0.6 ? corte.slice(0, espacio) : corte).replace(/[\s,;:.]+$/, '')}…`;
}

export function metaDiario(
  p: PaginaPublica,
  opciones: { sitio?: string; imagen?: string } = {}
): MetaDiario {
  const sitio = (opciones.sitio ?? SITIO_POR_DEFECTO).replace(/\/+$/, '');
  const url = urlDiario(p.id, sitio);
  const tituloCorto = tituloDiario(p);
  const { borges, bioy } = nombres(p);
  return {
    titulo: `${tituloCorto} · ${NOMBRE_SITIO}`,
    tituloCorto,
    descripcion: extractoDiario(p),
    url,
    imagen: opciones.imagen ?? (esDemo(p.id) ? `${sitio}/og.png` : `${url}og.png`),
    imagenAlt: `Primera página del diario apócrifo de ${borges} según ${bioy} · ${MARCA}`,
  };
}

export function escaparHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** JSON dentro de <script>: sin «</script>» ni separadores de línea que rompan el HTML. */
export function jsonEnScript(x: unknown): string {
  return JSON.stringify(x)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function jsonLdDiario(p: PaginaPublica, m: MetaDiario, sitio = SITIO_POR_DEFECTO) {
  const { borges, bioy } = nombres(p);
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    headline: `${borges}, según ${bioy}`,
    description: m.descripcion,
    inLanguage: 'es-AR',
    genre: 'Parodia literaria · Diario apócrifo',
    datePublished: p.creada,
    wordCount: p.entrada.palabras,
    image: m.imagen,
    url: m.url,
    isPartOf: { '@type': 'WebApplication', name: NOMBRE_SITIO, url: `${sitio.replace(/\/+$/, '')}/` },
  };
}

/** Reemplaza el atributo de la primera etiqueta que coincide; falla si no está (plantilla rota). */
function cambiarAtributo(html: string, etiqueta: RegExp, attr: string, valor: string): string {
  let hallada = false;
  const out = html.replace(etiqueta, (tag) => {
    hallada = true;
    return tag.replace(new RegExp(`\\s${attr}="[^"]*"`), ` ${attr}="${escaparHtml(valor)}"`);
  });
  if (!hallada) throw new Error(`seoDiario: la plantilla no tiene ${etiqueta}`);
  return out;
}

const metaProp = (prop: string) => new RegExp(`<meta\\s+property="${prop}"[^>]*>`);
const metaName = (name: string) => new RegExp(`<meta\\s+name="${name}"[^>]*>`);

/**
 * A partir del index.html prerenderizado de la portada arma /d/<id>/index.html:
 * metadatos del diario, rutas relativas un par de niveles más arriba, el diario
 * renderizado en #root y sus datos para que el cliente hidrate sin pedir nada.
 */
export function htmlDiario(
  plantilla: string,
  p: PaginaPublica,
  cuerpo: string,
  m: MetaDiario,
  opciones: { base?: string; sitio?: string } = {}
): string {
  const base = opciones.base ?? '../../';
  let html = plantilla.replace(/(<head[^>]*>)/, `$1\n    <script>window.__RB_BASE__=${JSON.stringify(base)}</script>`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escaparHtml(m.titulo)}</title>`);
  html = cambiarAtributo(html, metaName('description'), 'content', m.descripcion);
  html = cambiarAtributo(html, /<link\s+rel="canonical"[^>]*>/, 'href', m.url);
  html = cambiarAtributo(html, metaProp('og:type'), 'content', 'article');
  html = cambiarAtributo(html, metaProp('og:title'), 'content', m.tituloCorto);
  html = cambiarAtributo(html, metaProp('og:description'), 'content', m.descripcion);
  html = cambiarAtributo(html, metaProp('og:url'), 'content', m.url);
  html = cambiarAtributo(html, metaProp('og:image'), 'content', m.imagen);
  html = cambiarAtributo(html, metaProp('og:image:alt'), 'content', m.imagenAlt);
  html = cambiarAtributo(html, metaName('twitter:title'), 'content', m.tituloCorto);
  html = cambiarAtributo(html, metaName('twitter:description'), 'content', m.descripcion);
  html = cambiarAtributo(html, metaName('twitter:image'), 'content', m.imagen);
  html = html.replace(
    metaName('twitter:image'),
    (tag) => `${tag}\n    <meta name="twitter:image:alt" content="${escaparHtml(m.imagenAlt)}" />`
  );
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">${jsonEnScript(jsonLdDiario(p, m, opciones.sitio))}</script>`
  );
  // Rutas relativas de la portada (./assets, favicon.svg…) → un par de niveles arriba.
  html = html.replace(
    /\s(src|href)="(?!https?:|\/\/|\/|#|data:|mailto:|\.\.\/)(?:\.\/)?([^"]*)"/g,
    (_t, attr: string, ruta: string) => ` ${attr}="${base}${ruta}"`
  );
  const raiz = /<div id="root">[\s\S]*<\/div>(\s*<noscript>)/;
  if (!raiz.test(html)) throw new Error('seoDiario: no encontré <div id="root"> en la plantilla');
  html = html.replace(
    raiz,
    (_t, noscript: string) =>
      `<div id="root">${cuerpo}</div>\n    <script id="bdb-pagina" type="application/json">${jsonEnScript(p)}</script>${noscript}`
  );
  return html;
}

export interface EntradaSitemap {
  url: string;
  lastmod: string;
  changefreq: 'weekly' | 'monthly' | 'yearly';
  priority: string;
}

export function sitemapXml(entradas: EntradaSitemap[]): string {
  const filas = entradas.map(
    (e) =>
      `  <url><loc>${escaparHtml(e.url)}</loc><lastmod>${e.lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${filas.join('\n')}\n</urlset>\n`;
}
