import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './fuentes.css';
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
