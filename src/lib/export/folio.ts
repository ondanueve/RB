import type { Entrada, EntradaDia } from "../types";

type DiaMin = Pick<EntradaDia, "anio" | "encabezado" | "situacion" | "parrafos">;

/** Número de página verosímil y determinístico para una página. */
export function folioDe(entrada: { dias: Pick<EntradaDia, "encabezado" | "parrafos">[] }): number {
  const enc = entrada.dias.map((d) => d.encabezado).join("");
  const txt = entrada.dias.map((d) => d.parrafos.join("")).join("");
  return 100 + ((enc.length * 37 + txt.length) % 1400);
}

export type Bloque = { tipo: "anio"; anio: string } | ({ tipo: "dia" } & DiaMin);

/**
 * Secuencia de bloques de la página: el año se imprime antes de la primera entrada
 * y cada vez que cambia (por ejemplo, de diciembre a enero).
 */
export function bloquesDePagina(entrada: { dias: DiaMin[] }): Bloque[] {
  const out: Bloque[] = [];
  let anio = "";
  for (const d of entrada.dias) {
    if (d.anio !== anio) {
      out.push({ tipo: "anio", anio: d.anio });
      anio = d.anio;
    }
    out.push({ tipo: "dia", ...d });
  }
  return out;
}

export type { Entrada };
