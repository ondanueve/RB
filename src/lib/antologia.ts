import type { PaginaPublica } from './storage/tipos';

/**
 * Antología de demo: páginas generadas DE VERDAD por el endpoint público `generate`
 * (el mismo que usa la web), guardadas tal cual en antologia/fuente/demoN.json.
 * Acá solo se les asigna el id estable demoNborges y, si hace falta, se aplican
 * correcciones ortográficas explícitas y documentadas (antologia/correcciones.json).
 */
export interface Correccion {
  id: string;
  buscar: string;
  reemplazo: string;
  motivo: string;
}

export function idDemo(i: number): string {
  return `demo${i + 1}borges`;
}

function corregir(texto: string, cs: Correccion[]): string {
  return cs.reduce((t, c) => t.split(c.buscar).join(c.reemplazo), texto);
}

export function ensamblarAntologia(fuentes: PaginaPublica[], correcciones: Correccion[] = []): PaginaPublica[] {
  return fuentes.map((p, i) => {
    const id = idDemo(i);
    const cs = correcciones.filter((c) => c.id === id);
    for (const c of cs) {
      const json = JSON.stringify(p.entrada);
      if (!json.includes(c.buscar)) throw new Error(`Corrección sin efecto en ${id}: «${c.buscar}»`);
    }
    const entrada = {
      ...p.entrada,
      dias: p.entrada.dias.map((d) => ({
        ...d,
        situacion: corregir(d.situacion, cs),
        parrafos: d.parrafos.map((x) => corregir(x, cs)),
      })),
      notas: p.entrada.notas.map((x) => corregir(x, cs)),
    };
    return { ...p, entrada, id, creada: `${p.parametros.fecha}T12:00:00Z` } as PaginaPublica;
  });
}
