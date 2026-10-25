import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
// Fuente autoalojada (antes Google Fonts): solo latín y latín extendido, 400 / 400 itálica / 600.
import '@fontsource/eb-garamond/latin-400.css';
import '@fontsource/eb-garamond/latin-ext-400.css';
import '@fontsource/eb-garamond/latin-400-italic.css';
import '@fontsource/eb-garamond/latin-ext-400-italic.css';
import '@fontsource/eb-garamond/latin-600.css';
import '@fontsource/eb-garamond/latin-ext-600.css';
import App from './App.tsx';
import './index.css';

const raiz = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// En producción index.html llega prerenderizado (scripts/prerender.mjs): hidratar; en dev, montar.
if (raiz.hasChildNodes()) hydrateRoot(raiz, app);
else createRoot(raiz).render(app);
