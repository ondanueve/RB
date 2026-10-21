/**
 * Reparto del diario en páginas (1 o 2, enfrentadas como un libro abierto) y cornisa.
 * Lo usan el pipeline, la vista web, las exportaciones y la imagen para compartir.
 * Las páginas guardadas antes de este cambio no tienen `paginas`: son una sola página.
 */
import type { Entrada, EntradaDia, Persona } from "./types";

/** Apellido con el que se nombra a alguien en la narración ("Messi", "Bioy Casares"). */
export function apellidoDe(x: Pick<Persona, "nombre"> & { apellido?: string }): string {
  const a = x.apellido?.trim();
  if (a) return a;
  const ws = x.nombre.trim().split(/\s+/);
  return ws[ws.length - 1] ?? x.nombre;
}

/** Entradas por página; si el dato falta o no cierra, todo va en una sola página. */
export function repartoDe(e: Pick<Entrada, "dias"> & { paginas?: number[] }): number[] {
  const r = e.paginas;
  const n = e.dias.length;
  if (Array.isArray(r) && r.length >= 1 && r.every((k) => Number.isInteger(k) && k > 0) && r.reduce((a, b) => a + b, 0) === n) return r;
  return [n];
}

/** Separa una lista (días u otra cosa) según el reparto. */
export function partir<T>(xs: T[], reparto: number[]): T[][] {
  const out: T[][] = [];
  let i = 0;
  for (const k of reparto) {
    out.push(xs.slice(i, i + k));
    i += k;
  }
  return out;
}

export interface NotaNumerada {
  numero: number;
  texto: string;
}

export interface PaginaDeDiario {
  dias: EntradaDia[];
  /** Notas al pie correspondientes a esta página (texto limpio). */
  notas: string[];
  /** Notas con su número de llamada original (1, 2, …). */
  notasNumeradas?: NotaNumerada[];
}

const SUPERINDICES = ["¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];

function paginaTieneLlamada(dias: EntradaDia[], numero: number): boolean {
  const sup = SUPERINDICES[numero - 1];
  const texto = dias.map((d) => `${d.situacion} ${d.parrafos.join(" ")}`).join(" ");
  if (sup && texto.includes(sup)) return true;
  if (texto.includes(`[${numero}]`)) return true;
  return false;
}

export function paginasDe(
  e: Pick<Entrada, "dias" | "notas"> & { paginas?: number[] },
): PaginaDeDiario[] {
  const grupos = partir(e.dias, repartoDe(e));
  const todasNotas = e.notas ?? [];
  if (grupos.length <= 1 || todasNotas.length === 0) {
    return grupos.map((dias, i) => {
      const ns = i === grupos.length - 1 ? todasNotas : [];
      return {
        dias,
        notas: ns,
        notasNumeradas: ns.map((texto, idx) => ({ numero: idx + 1, texto })),
      };
    });
  }

  const porPagina: NotaNumerada[][] = grupos.map(() => []);
  todasNotas.forEach((textoLimpio, idx) => {
    const numero = idx + 1;
    const texto = textoLimpio.replace(/^(?:[¹²³⁴⁵⁶⁷⁸⁹]|\[\d+\]|\d+\.)\s*/, "");
    const pagIdx = grupos.findIndex((dias) => paginaTieneLlamada(dias, numero));
    const destino = pagIdx >= 0 ? pagIdx : grupos.length - 1;
    porPagina[destino].push({ numero, texto });
  });

  return grupos.map((dias, i) => ({
    dias,
    notas: porPagina[i].map((n) => n.texto),
    notasNumeradas: porPagina[i],
  }));
}

/** Cornisa de las páginas: el campo nuevo, la de una tapa vieja o el apellido del "Borges". */
export function tituloDe(p: {
  titulo?: string;
  edicion?: { titulo?: string };
  validacion?: { borges?: Pick<Persona, "nombre"> & { apellido?: string } };
  parametros?: { borges?: string };
}): string {
  if (p.titulo?.trim()) return p.titulo.trim();
  if (p.edicion?.titulo?.trim()) return p.edicion.titulo.trim();
  if (p.validacion?.borges?.nombre) return apellidoDe(p.validacion.borges);
  return p.parametros?.borges ? apellidoDe({ nombre: p.parametros.borges }) : "Diario";
}
