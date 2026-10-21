/**
 * Lógica de fechas: chequeo de verosimilitud (ambos vivos y ya conocidos)
 * y encabezados al estilo de un diario ("Martes, 14 de junio.").
 *
 * Todo en UTC y con fechas "puras" (AAAA-MM-DD) para evitar corrimientos por zona horaria.
 */

export const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export type FechaParcial = string | null | undefined; // "AAAA", "AAAA-MM" o "AAAA-MM-DD"

export interface DatosVitales {
  nombre: string;
  nacimiento?: FechaParcial;
  muerte?: FechaParcial; // null/undefined = vive
}

export interface ChequeoFecha {
  ok: boolean;
  motivos: string[];
  advertencias: string[];
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Convierte una fecha parcial a un rango [desde, hasta].
 * "1931" -> [1931-01-01, 1931-12-31]; "1931-05" -> [1931-05-01, 1931-05-31].
 */
export function rangoDeFechaParcial(s: string): [Date, Date] | null {
  const t = s.trim();
  let m = /^(\d{4})$/.exec(t);
  if (m) {
    const y = Number(m[1]);
    return [new Date(Date.UTC(y, 0, 1)), new Date(Date.UTC(y, 11, 31))];
  }
  m = /^(\d{4})-(\d{2})$/.exec(t);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    return [new Date(Date.UTC(y, mo, 1)), new Date(Date.UTC(y, mo + 1, 0))];
  }
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (m) {
    const d = parseISO(t);
    return [d, d];
  }
  return null;
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Verifica que la fecha de la entrada sea verosímil:
 *  - no futura (no podemos reunir contexto de lo que no pasó),
 *  - ambos nacidos y vivos ese día,
 *  - posterior (o igual) al inicio documentado de la relación.
 * Si las fechas de origen son imprecisas (solo año), el caso ambiguo se marca como advertencia.
 */
export function chequearFecha(
  fecha: string,
  borges: DatosVitales,
  bioy: DatosVitales,
  inicioRelacion: FechaParcial,
  hoy: Date = new Date(),
): ChequeoFecha {
  const motivos: string[] = [];
  const advertencias: string[] = [];
  const f = parseISO(fecha);

  const hoyUTC = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  if (f.getTime() > hoyUTC.getTime()) {
    motivos.push(`La fecha ${fecha} es futura: no hay contexto histórico real para esa fecha.`);
  }

  for (const p of [borges, bioy]) {
    if (p.nacimiento) {
      const r = rangoDeFechaParcial(p.nacimiento);
      if (r) {
        if (f < r[0]) motivos.push(`${p.nombre} todavía no había nacido el ${fecha}.`);
        else if (f <= r[1]) advertencias.push(`La fecha está muy cerca del nacimiento de ${p.nombre}.`);
      }
    } else {
      advertencias.push(`No se pudo confirmar la fecha de nacimiento de ${p.nombre}.`);
    }
    if (p.muerte) {
      const r = rangoDeFechaParcial(p.muerte);
      if (r) {
        if (f > r[1]) motivos.push(`${p.nombre} ya había muerto el ${fecha} (murió en ${p.muerte}).`);
        else if (f >= r[0] && r[0].getTime() !== r[1].getTime())
          advertencias.push(`No es seguro que ${p.nombre} siguiera vivo el ${fecha} (murió en ${p.muerte}).`);
      }
    }
  }

  if (inicioRelacion) {
    const r = rangoDeFechaParcial(inicioRelacion);
    if (r) {
      if (f < r[0]) {
        motivos.push(
          `${borges.nombre} y ${bioy.nombre} todavía no se conocían el ${fecha} (la relación documentada empieza en ${inicioRelacion}).`,
        );
      } else if (f <= r[1] && r[0].getTime() !== r[1].getTime()) {
        advertencias.push(
          `La relación empieza en ${inicioRelacion}; no es seguro que ya se conocieran el ${fecha}.`,
        );
      }
    }
  } else {
    advertencias.push("No se pudo determinar desde cuándo se conocen.");
  }

  return { ok: motivos.length === 0, motivos, advertencias };
}

/** "Martes, 14 de junio." — encabezado de entrada al estilo de un diario. */
export function encabezadoDeEntrada(fecha: string): string {
  const d = parseISO(fecha);
  return `${DIAS[d.getUTCDay()]}, ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}.`;
}

/** Año como encabezado de sección ("1957"). */
export function encabezadoDeAnio(fecha: string): string {
  return String(parseISO(fecha).getUTCFullYear());
}

/** "14 de junio de 1957" */
export function fechaLarga(fecha: string): string {
  const d = parseISO(fecha);
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

/** Suma días a una fecha ISO (útil para ventanas de contexto). */
export function sumarDias(fecha: string, dias: number): string {
  const d = parseISO(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return fmt(d);
}

/** Días entre dos fechas ISO (b - a). */
export function diasEntre(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
}

/**
 * Último desplazamiento (0..maxDias) desde `fecha` en el que la escena sigue siendo
 * verosímil (ambos vivos, ya conocidos, no futura). Devuelve -1 si ni `fecha` sirve.
 */
export function finDeVentana(
  fecha: string,
  borges: DatosVitales,
  bioy: DatosVitales,
  inicioRelacion: FechaParcial,
  maxDias: number,
  hoy: Date = new Date(),
): number {
  // La ventana es continua: avanza mientras cada día siga siendo verosímil.
  let fin = -1;
  for (let d = 0; d <= maxDias; d++) {
    if (!chequearFecha(sumarDias(fecha, d), borges, bioy, inicioRelacion, hoy).ok) break;
    fin = d;
  }
  return fin;
}

/**
 * Fechas de las entradas de una página: empieza en `fecha`, sigue en días o semanas
 * posteriores dentro de [fecha, fecha + fin]. Usa las sugeridas por el contexto si son
 * válidas y completa con saltos verosímiles (determinísticos según `semilla`).
 */
export function fechasDePagina(sugeridas: string[], fecha: string, fin: number, n: number, semilla = 0): string[] {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const offsets = new Set<number>([0]);
  for (const s of sugeridas) {
    if (!iso.test(s)) continue;
    const d = diasEntre(fecha, s);
    if (Number.isFinite(d) && d > 0 && d <= fin) offsets.add(d);
  }
  let lista = [...offsets].sort((a, b) => a - b);
  if (lista.length > n) lista = [0, ...lista.slice(1, n)];
  const saltos = [1, 2, 3, 4, 6, 8, 11, 15, 20];
  let k = semilla;
  while (lista.length < n && fin > 0) {
    const ultimo = lista[lista.length - 1];
    const libres = saltos.map((s) => ultimo + s).filter((d) => d <= fin && !lista.includes(d));
    if (!libres.length) {
      const hueco = Array.from({ length: fin }, (_, i) => i + 1).find((d) => !lista.includes(d));
      if (hueco === undefined) break;
      lista.push(hueco);
    } else {
      lista.push(libres[k % Math.min(3, libres.length)]);
      k = Math.floor(k / 3) + 1;
    }
    lista.sort((a, b) => a - b);
  }
  return lista.slice(0, n).map((d) => sumarDias(fecha, d));
}
