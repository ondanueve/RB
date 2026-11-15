/**
 * Prerender (build): HTML estático de la portada con la primera página de demo,
 * para que buscadores y lectores sin JavaScript vean contenido real. El cliente hidrata encima.
 */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.tsx';
import type { PaginaPublica } from './lib/storage/tipos';

export function render(paginaInicial?: PaginaPublica): string {
  return renderToString(
    <StrictMode>
      <App paginaInicial={paginaInicial} />
    </StrictMode>
  );
}

// Para scripts/diarios.mjs (páginas estáticas /d/<id>/).
export { htmlDiario, metaDiario, sitemapXml, urlDiario, esDemo } from './lib/seoDiario';
export { ID_VALIDO, parecePagina } from './lib/storage/tipos';
export { paraPublicar } from './lib/publicable';
export { SITIO_POR_DEFECTO, SUPABASE_FUNCTIONS_API } from './lib/sitio';
