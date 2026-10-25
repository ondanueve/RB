/**
 * Prerender (build): HTML estático de la portada con la primera página de demo,
 * para que buscadores y lectores sin JavaScript vean contenido real. El cliente hidrata encima.
 */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.tsx';

export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
