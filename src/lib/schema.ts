/**
 * Esquema de parámetros de entrada (zod).
 *
 * Obligatorios: borges, bioy, fecha.
 * Optativos: criticados, alabados, escena, presentes, tema, tono, extension, paginas, entradas.
 */
import { z } from "zod";

export { ESCENAS_SUGERIDAS, TONOS, EXTENSIONES } from "./opciones";
import { EXTENSIONES, type Extension } from "./opciones";
export type { Extension } from "./opciones";

/**
 * Palabras aproximadas de CADA página por extensión (guía para el modelo y el mock).
 * Cada página es una página impresa, así que hasta "larga" entra en una página.
 */
export const PALABRAS_POR_EXTENSION: Record<Extension, [number, number]> = {
  corta: [220, 320],
  media: [350, 450],
  larga: [430, 520],
};

/** Páginas del diario: por defecto dos, enfrentadas como un libro abierto. */
export const PAGINAS_MAX = 2;
export const PAGINAS_POR_DEFECTO = 2;
/** Cantidad de entradas por página (si no se fija, se sortea entre estos valores). */
export const ENTRADAS_MIN = 2;
export const ENTRADAS_MAX = 4;
/** Días hacia adelante desde `fecha` en los que pueden caer las entradas siguientes. */
export const VENTANA_DIAS = 21;

const nombre = z
  .string()
  .trim()
  .min(2, "El nombre es demasiado corto")
  .max(80, "El nombre es demasiado largo")
  // Letras (con acentos), espacios, puntos, guiones y apóstrofos. Nada de URLs ni código.
  .regex(/^[\p{L}][\p{L}\p{M} .'’\-]*$/u, "Solo letras, espacios, puntos, guiones o apóstrofos");

const listaDeNombres = z
  .array(nombre)
  .max(5, "Como máximo 5 personas")
  .default([]);

const textoCorto = (max: number) => z.string().trim().max(max);

/** Fecha ISO AAAA-MM-DD, validada como fecha real del calendario. */
export const fechaISO = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD")
  .refine((s) => {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }, "La fecha no existe en el calendario");

export const parametrosSchema = z
  .object({
    // --- Obligatorios ---
    borges: nombre,
    bioy: nombre,
    fecha: fechaISO,
    // --- Optativos ---
    criticados: listaDeNombres,
    alabados: listaDeNombres,
    escena: textoCorto(120).optional(),
    presentes: listaDeNombres,
    tema: textoCorto(200).optional(),
    tono: textoCorto(40).optional(),
    extension: z.enum(EXTENSIONES).default("media"),
    /** Páginas del diario (1 o 2, enfrentadas como un libro abierto). Por defecto, 2. */
    paginas: z.preprocess(
      (v) => (v === "" || v == null ? undefined : typeof v === "string" ? Number(v) : v),
      z.number().int().min(1, `Entre 1 y ${PAGINAS_MAX} páginas`).max(PAGINAS_MAX, `Entre 1 y ${PAGINAS_MAX} páginas`).default(PAGINAS_POR_DEFECTO),
    ),
    /** Entradas por página (2-4). Si falta, se sortea para cada página. */
    entradas: z.preprocess(
      (v) => (v === "" || v == null ? undefined : typeof v === "string" ? Number(v) : v),
      z.number().int().min(ENTRADAS_MIN, `Entre ${ENTRADAS_MIN} y ${ENTRADAS_MAX} entradas`).max(ENTRADAS_MAX, `Entre ${ENTRADAS_MIN} y ${ENTRADAS_MAX} entradas`).optional(),
    ),
  })
  .refine((p) => p.borges.toLowerCase() !== p.bioy.toLowerCase(), {
    message: "Borges y Bioy tienen que ser personas distintas",
    path: ["bioy"],
  });

export type ParametrosInput = z.input<typeof parametrosSchema>;
export type Parametros = z.output<typeof parametrosSchema>;

/** Valida y normaliza. Devuelve errores legibles en castellano. */
export function parsearParametros(input: unknown):
  | { ok: true; data: Parametros }
  | { ok: false; errores: { campo: string; mensaje: string }[] } {
  // Aceptamos listas como string separado por comas desde formularios simples.
  const normalizado = normalizarListas(input);
  const r = parametrosSchema.safeParse(normalizado);
  if (r.success) return { ok: true, data: r.data };
  return {
    ok: false,
    errores: r.error.issues.map((i) => ({ campo: i.path.join(".") || "(general)", mensaje: i.message })),
  };
}

function normalizarListas(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const o = { ...(input as Record<string, unknown>) };
  for (const k of ["criticados", "alabados", "presentes"]) {
    const v = o[k];
    if (typeof v === "string") {
      o[k] = v
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  for (const k of ["escena", "tema", "tono"]) {
    if (typeof o[k] === "string" && (o[k] as string).trim() === "") delete o[k];
  }
  return o;
}
