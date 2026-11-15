import type { PaginaPublica } from './storage/tipos';

/**
 * Lo que se incrusta en el sitio estático (antología de demo, /d/<id>/index.html y
 * /d/<id>/pagina.json): el diario sin los datos técnicos internos del backend
 * (proveedor de texto, advertencias del pipeline, contexto de apoyo) ni notas técnicas en las fuentes.
 * El sitio no los muestra y no tienen por qué quedar en el código de la página.
 */
export function paraPublicar(p: PaginaPublica): PaginaPublica {
  const limpio = JSON.parse(
    JSON.stringify(p).split(' (citada por el modelo, sin verificar)').join(' (sin verificar)')
  ) as Partial<PaginaPublica> & Record<string, unknown>;
  delete limpio.proveedores;
  delete limpio.advertencias;
  delete limpio.contexto; // hechos y fuentes de apoyo para escribir: el sitio no los muestra
  return limpio as PaginaPublica;
}
