import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { generar } from './src/lib/pipeline.ts';
import { PAREJAS_DEMO } from './src/lib/demo.ts';
import {
  nuevoId,
  paginaPublica,
  type PaginaPublica,
  ID_VALIDO,
} from './src/lib/storage/tipos.ts';

dotenv.config();

const PORT = 3000;
const paginasStore = new Map<string, PaginaPublica>();

async function seedDemoPages() {
  for (let i = 0; i < PAREJAS_DEMO.length; i++) {
    const par = PAREJAS_DEMO[i];
    const slugId = `demo${i + 1}borges`;
    const r = await generar(
      {
        borges: par.borges.nombre,
        bioy: par.bioy.nombre,
        fecha: par.fechaEjemplo,
        escena: par.escenaEjemplo,
        extension: 'media',
        paginas: 2,
      },
      {
        env: { TEXT_PROVIDER: 'mock', IMAGE_PROVIDER: 'none' },
        azar: () => 0.35,
      }
    );
    if (r.ok) {
      const pub = paginaPublica(r, slugId, new Date(`${par.fechaEjemplo}T12:00:00Z`));
      paginasStore.set(slugId, pub);
    }
  }
}

async function startServer() {
  await seedDemoPages();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // List pre-seeded & recent public pages for the Anthology
  app.get('/api/antologia', (_req, res) => {
    const items = Array.from(paginasStore.values());
    res.json({ ok: true, paginas: items });
  });

  // Read a single published page by id
  app.get('/api/page', (req, res) => {
    const id = String(req.query.id ?? '').trim();
    if (!id) {
      res.status(400).json({ ok: false, mensaje: 'Falta el parámetro id.' });
      return;
    }
    const found = paginasStore.get(id);
    if (!found) {
      res.status(404).json({ ok: false, mensaje: 'Página no encontrada.' });
      return;
    }
    res.json({ ok: true, pagina: found });
  });

  // Generate a new apocryphal diary entry
  app.post('/api/generate', async (req, res) => {
    try {
      const rawBody = req.body && typeof req.body === 'object' ? { ...req.body } : {};
      const modoDemo = Boolean(rawBody.modoDemo);
      delete rawBody.modoDemo;

      let solicitud: string | null = null;
      if (typeof rawBody.solicitud === 'string' && ID_VALIDO.test(rawBody.solicitud)) {
        solicitud = rawBody.solicitud;
      }
      delete rawBody.solicitud;

      if (solicitud && paginasStore.has(solicitud)) {
        const ya = paginasStore.get(solicitud)!;
        res.json({ ok: true, id: ya.id, pagina: ya });
        return;
      }

      const hasGeminiKey =
        Boolean(process.env.GEMINI_API_KEY) &&
        process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';

      const useGemini = !modoDemo && hasGeminiKey;

      let r = await generar(rawBody, {
        env: {
          ...process.env,
          TEXT_PROVIDER: useGemini ? 'gemini' : 'mock',
          IMAGE_PROVIDER: 'none',
        },
        plazoMs: 85_000,
        limiteMs: 120_000,
      });

      // If Gemini fails due to quota/network and the pair is one of the demo pairs, fallback gracefully
      if (!r.ok && useGemini && r.etapa === 'validacion') {
        // Keep genuine validation rejections
      }

      if (!r.ok) {
        res.status(r.etapa === 'parametros' ? 400 : 422).json(r);
        return;
      }

      const id = solicitud ?? nuevoId();
      const pub = paginaPublica(r, id);
      paginasStore.set(pub.id, pub);

      res.json({ ok: true, id: pub.id, pagina: pub });
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      res.status(500).json({
        ok: false,
        mensaje: `No se pudo generar la entrada: ${msg.slice(0, 240)}`,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`rayo borgesdebioyizador server listening on http://localhost:${PORT}`);
  });
}

startServer();
