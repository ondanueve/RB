import type { PaginaPublica, Pedido } from './storage/tipos';

export type CampoPedido = keyof Pedido;
export const CAMPOS_PEDIDO: CampoPedido[] = ['borges', 'bioy', 'fecha', 'escena', 'criticados', 'alabados', 'presentes', 'tema', 'tono'];

/**
 * El pedido que generó el diario, campo por campo, para cargarlo en el formulario. Los diarios
 * nuevos guardan el texto literal del formulario (`pedido`); en los anteriores se lee de los
 * parámetros guardados (las listas, separadas por comas). Un campo vacío queda vacío: nunca
 * se completa con valores por defecto.
 */
export function pedidoDelDiario(p: PaginaPublica): Record<CampoPedido, string> {
  const par = (p.parametros ?? {}) as unknown as Record<string, unknown>;
  const out = {} as Record<CampoPedido, string>;
  for (const campo of CAMPOS_PEDIDO) {
    const literal = p.pedido?.[campo];
    if (typeof literal === 'string') {
      out[campo] = literal;
      continue;
    }
    const v = par[campo];
    out[campo] = Array.isArray(v) ? v.join(', ') : typeof v === 'string' ? v : '';
  }
  return out;
}

