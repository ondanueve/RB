import type { PaginaPublica } from './storage/tipos';
import { NOMBRE_SITIO } from './sitio';
import { repartoDe } from './paginas';

const DEFAULT_TITLE = `${NOMBRE_SITIO} — Diarios apócrifos al estilo de Bioy y Borges`;
const DEFAULT_DESC =
  'Diarios apócrifos al estilo de las anotaciones de Adolfo Bioy Casares sobre Jorge Luis Borges.';

function setMeta(selector: string, attr: 'content' | 'href', val: string) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, val);
}

export function sincronizarSeoPagina(p: PaginaPublica | null) {
  if (typeof document === 'undefined') return;

  if (!p) {
    document.title = DEFAULT_TITLE;
    setMeta('meta[name="description"]', 'content', DEFAULT_DESC);
    setMeta('meta[property="og:title"]', 'content', DEFAULT_TITLE);
    setMeta('meta[property="og:description"]', 'content', DEFAULT_DESC);
    setMeta('meta[name="twitter:title"]', 'content', DEFAULT_TITLE);
    setMeta('meta[name="twitter:description"]', 'content', DEFAULT_DESC);
    return;
  }

  const dos = repartoDe(p.entrada).length > 1;
  const borges = p.validacion?.borges?.nombre || p.parametros.borges;
  const bioy = p.validacion?.bioy?.nombre || p.parametros.bioy;
  const titulo = `${borges}, según ${bioy}: ${
    dos ? 'dos páginas' : 'una página'
  } del diario apócrifo · ${NOMBRE_SITIO}`;

  const primera = p.entrada.dias[0];
  const extracto = primera
    ? `${primera.anio}. ${primera.encabezado} ${primera.situacion} ${primera.parrafos.join(' ')}`
    : '';
  const desc =
    extracto.length > 155 ? `${extracto.slice(0, 152).trim()}…` : extracto || DEFAULT_DESC;

  document.title = titulo;
  setMeta('meta[name="description"]', 'content', desc);
  setMeta('meta[property="og:title"]', 'content', titulo);
  setMeta('meta[property="og:description"]', 'content', desc);
  setMeta('meta[name="twitter:title"]', 'content', titulo);
  setMeta('meta[name="twitter:description"]', 'content', desc);

  const url = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(
    p.id
  )}`;
  setMeta('link[rel="canonical"]', 'href', url);
  setMeta('meta[property="og:url"]', 'content', url);

  // Inject or update dynamic CreativeWork JSON-LD
  let ldScript = document.getElementById('bdb-dynamic-jsonld') as HTMLScriptElement | null;
  if (!ldScript) {
    ldScript = document.createElement('script');
    ldScript.id = 'bdb-dynamic-jsonld';
    ldScript.type = 'application/ld+json';
    document.head.appendChild(ldScript);
  }
  ldScript.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    headline: `${borges}, según ${bioy}`,
    description: desc,
    inLanguage: 'es-AR',
    genre: 'Parodia literaria · Diario apócrifo',
    datePublished: p.creada,
    wordCount: p.entrada.palabras,
    url,
    isPartOf: {
      '@type': 'WebApplication',
      name: NOMBRE_SITIO,
      url: 'https://bitcoinizate.com/borgesdebioyizador/',
    },
  });
}
