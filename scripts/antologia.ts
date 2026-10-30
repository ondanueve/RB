/**
 * Antología de demo generada con el MISMO camino que usa la web (endpoint público `generate`
 * de Supabase, con los mismos campos que manda el formulario). Nada de modo mock.
 *
 *   npm run antologia -- --generar 3     pide al endpoint en vivo la demo 3 y la guarda en
 *                                        antologia/fuente/demo3.json (respeta el límite por IP)
 *   npm run antologia                    arma src/generated/antologia.json con las fuentes
 *                                        (ids demoNborges + correcciones de antologia/correcciones.json)
 *
 * tests/antologia.test.ts verifica que el JSON esté al día y que cada entrada abra
 * presentando la escena y a los participantes, como en el diario original.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensamblarAntologia, type Correccion } from '../src/lib/antologia';
import { PAREJAS_DEMO } from '../src/lib/demo';
import type { PaginaPublica } from '../src/lib/storage/tipos';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENDPOINT = process.env.GENERATE_URL ?? 'https://xhewdrhfofwpzfogthai.supabase.co/functions/v1/generate';
const fuente = (n: number) => resolve(raiz, `antologia/fuente/demo${n}.json`);

const i = process.argv.indexOf('--generar');
if (i > 0) {
  const n = Number(process.argv[i + 1]);
  const par = PAREJAS_DEMO[n - 1];
  if (!par) throw new Error(`No existe la demo ${n}`);
  // Mismo cuerpo que arma el formulario de la web (src/App.tsx).
  const cuerpo = {
    borges: par.borges.nombre,
    bioy: par.bioy.nombre,
    fecha: par.fechaEjemplo,
    criticados: '',
    alabados: '',
    presentes: '',
    escena: par.escenaEjemplo,
    ...(par.temaEjemplo ? { tema: par.temaEjemplo } : {}),
    tono: 'irónico',
    extension: 'media',
  };
  const r = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://ondanueve.github.io' },
    body: JSON.stringify(cuerpo),
  });
  const d = (await r.json()) as { ok: boolean; pagina?: PaginaPublica; mensaje?: string; detalle?: string };
  if (!d.ok || !d.pagina) throw new Error(`demo ${n}: HTTP ${r.status} ${d.mensaje ?? ''} ${d.detalle ?? ''}`);
  mkdirSync(dirname(fuente(n)), { recursive: true });
  writeFileSync(fuente(n), JSON.stringify(d.pagina, null, 2) + '\n');
  console.log(`demo ${n}: ${d.pagina.id} (${d.pagina.proveedores.texto}) -> ${fuente(n)}`);
} else {
  const fuentes = PAREJAS_DEMO.map((_, k) => {
    if (!existsSync(fuente(k + 1))) throw new Error(`Falta ${fuente(k + 1)}: npm run antologia -- --generar ${k + 1}`);
    return JSON.parse(readFileSync(fuente(k + 1), 'utf8')) as PaginaPublica;
  });
  const correcciones = JSON.parse(readFileSync(resolve(raiz, 'antologia/correcciones.json'), 'utf8')) as Correccion[];
  const destino = resolve(raiz, 'src/generated/antologia.json');
  const paginas = ensamblarAntologia(fuentes, correcciones);
  writeFileSync(destino, JSON.stringify(paginas) + '\n');
  console.log(`antologia: ${paginas.length} páginas -> ${destino}`);
}
