import type { PaginaPublica, Pedido } from '../lib/storage/tipos';

type Campo = keyof Pedido;

/** Campos del formulario, con las mismas etiquetas que el formulario. */
export const CAMPOS_FORMULARIO: { campo: Campo; etiqueta: string }[] = [
  { campo: 'borges', etiqueta: 'Rol «Borges»' },
  { campo: 'bioy', etiqueta: 'Rol «Bioy» (el diarista)' },
  { campo: 'fecha', etiqueta: 'Fecha de la primera entrada' },
  { campo: 'escena', etiqueta: 'Escena inicial' },
  { campo: 'criticados', etiqueta: 'Criticados' },
  { campo: 'alabados', etiqueta: 'Alabados' },
  { campo: 'presentes', etiqueta: 'Presentes en la escena' },
  { campo: 'tema', etiqueta: 'Tema o disparador' },
  { campo: 'tono', etiqueta: 'Tono' },
];

/**
 * El pedido que generó el diario, campo por campo. Los diarios nuevos guardan el texto literal
 * del formulario (`pedido`); en los anteriores se lee de los parámetros guardados (las listas,
 * separadas por comas).
 */
export function pedidoDelDiario(p: PaginaPublica): Record<Campo, string> {
  const par = (p.parametros ?? {}) as unknown as Record<string, unknown>;
  const out = {} as Record<Campo, string>;
  for (const { campo } of CAMPOS_FORMULARIO) {
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

export function PedidoDiario({ pagina }: { pagina: PaginaPublica }) {
  const pedido = pedidoDelDiario(pagina);
  return (
    <section className="pedido" aria-labelledby="titulo-pedido">
      <h4 id="titulo-pedido">Pedido que generó este diario</h4>
      <dl>
        {CAMPOS_FORMULARIO.map(({ campo, etiqueta }) => {
          const v = pedido[campo];
          const vacio = v.trim() === '';
          return (
            <div key={campo} className="pedido-fila">
              <dt>{etiqueta}</dt>
              <dd className={vacio ? 'vacio' : undefined}>{vacio ? '(vacío)' : v}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
