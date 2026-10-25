/**
 * Genera src/generated/antologia.json: las páginas de demo (modo mock, determinísticas)
 * que el sitio muestra al cargar. Antes se calculaban en el navegador, lo que obligaba a
 * empaquetar todo el pipeline (SDK de Gemini, zod, prompts) en el bundle del cliente.
 * Uso: npm run antologia   (tests/antologia.test.ts verifica que el JSON esté al día)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { construirAntologia } from '../src/lib/antologia';

const destino = resolve(dirname(fileURLToPath(import.meta.url)), '../src/generated/antologia.json');
const paginas = await construirAntologia();
mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, JSON.stringify(paginas) + '\n');
console.log(`antologia: ${paginas.length} páginas -> ${destino}`);
