import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './fuentes.css';
import App from './App.tsx';
import './index.css';
import { baseSitio } from './lib/sitio';
import type { PaginaPublica } from './lib/storage/tipos';

baseSitio(); // fija la raíz antes de cualquier pushState

/** En /d/<id>/ el build deja el diario incrustado: se hidrata con los mismos datos del prerender. */
function paginaIncrustada(): PaginaPublica | undefined {
  const el = document.getElementById('bdb-pagina');
  if (!el?.textContent) return undefined;
  try {
    return JSON.parse(el.textContent) as PaginaPublica;
  } catch {
    return undefined;
  }
}

const raiz = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App paginaInicial={paginaIncrustada()} />
  </StrictMode>
);

// En producción index.html llega prerenderizado (scripts/prerender.mjs): hidratar; en dev, montar.
if (raiz.hasChildNodes()) hydrateRoot(raiz, app);
else createRoot(raiz).render(app);
