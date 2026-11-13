import type { PaginaPublica } from './storage/tipos';
import { NOMBRE_SITIO, SITIO_POR_DEFECTO } from './sitio';
import { OG_MARCA, jsonLdDiario, metaDiario } from './seoDiario';

const DEFAULT_TITLE = `${NOMBRE_SITIO} — Diarios apócrifos al estilo de Bioy y Borges`;
const DEFAULT_DESC =
  'Diarios apócrifos al estilo de las anotaciones de Adolfo Bioy Casares sobre Jorge Luis Borges.';
const HOME = `${SITIO_POR_DEFECTO}/`;

function setMeta(selector: string, attr: 'content' | 'href', val: string) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, val);
}

/**
 * Ajusta los metadatos en el navegador al diario que se está leyendo (buscadores que ejecutan JS).
 * Las vistas previas de X/WhatsApp no dependen de esto: leen el HTML estático de /d/<id>/
 * (scripts/diarios.mjs). El canonical de un diario generado apunta siempre a /d/<id>/, también
 * cuando se llega por un enlace viejo ?id=.
 */
export function sincronizarSeoPagina(p: PaginaPublica | null) {
  if (typeof document === 'undefined') return;

  if (!p) {
    document.title = DEFAULT_TITLE;
    setMeta('meta[name="description"]', 'content', DEFAULT_DESC);
    setMeta('meta[property="og:title"]', 'content', DEFAULT_TITLE);
    setMeta('meta[property="og:description"]', 'content', DEFAULT_DESC);
    setMeta('meta[name="twitter:title"]', 'content', DEFAULT_TITLE);
    setMeta('meta[name="twitter:description"]', 'content', DEFAULT_DESC);
    setMeta('link[rel="canonical"]', 'href', HOME);
    setMeta('meta[property="og:url"]', 'content', HOME);
    setMeta('meta[property="og:image"]', 'content', OG_MARCA);
    setMeta('meta[name="twitter:image"]', 'content', OG_MARCA);
    document.getElementById('bdb-dynamic-jsonld')?.remove();
    return;
  }

  const m = metaDiario(p);
  document.title = m.titulo;
  setMeta('meta[name="description"]', 'content', m.descripcion);
  setMeta('meta[property="og:title"]', 'content', m.tituloCorto);
  setMeta('meta[property="og:description"]', 'content', m.descripcion);
  setMeta('meta[name="twitter:title"]', 'content', m.tituloCorto);
  setMeta('meta[name="twitter:description"]', 'content', m.descripcion);
  setMeta('link[rel="canonical"]', 'href', m.url);
  setMeta('meta[property="og:url"]', 'content', m.url);
  setMeta('meta[property="og:image"]', 'content', m.imagen);
  setMeta('meta[name="twitter:image"]', 'content', m.imagen);

  let ldScript = document.getElementById('bdb-dynamic-jsonld') as HTMLScriptElement | null;
  if (!ldScript) {
    ldScript = document.createElement('script');
    ldScript.id = 'bdb-dynamic-jsonld';
    ldScript.type = 'application/ld+json';
    document.head.appendChild(ldScript);
  }
  ldScript.textContent = JSON.stringify(jsonLdDiario(p, m));
}
