import { PAREJAS_DEMO } from './demo';
import { generar } from './pipeline';
import { paginaPublica, type PaginaPublica } from './storage/tipos';

/** Páginas de demo en modo mock (determinísticas). Se usa en build y en el servidor local, nunca en el navegador. */
export async function construirAntologia(): Promise<PaginaPublica[]> {
  const paginas: PaginaPublica[] = [];
  for (let i = 0; i < PAREJAS_DEMO.length; i++) {
    const par = PAREJAS_DEMO[i];
    const r = await generar(
      {
        borges: par.borges.nombre,
        bioy: par.bioy.nombre,
        fecha: par.fechaEjemplo,
        escena: par.escenaEjemplo,
        extension: 'media',
        paginas: 2,
      },
      { env: { TEXT_PROVIDER: 'mock', IMAGE_PROVIDER: 'none' }, azar: () => 0.35 }
    );
    if (r.ok) paginas.push(paginaPublica(r, `demo${i + 1}borges`, new Date(`${par.fechaEjemplo}T12:00:00Z`)));
  }
  return paginas;
}
