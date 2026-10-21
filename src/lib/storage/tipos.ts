import type { ResultadoOk } from "../types";

/** 1: una página + tapa. 2: sin tapa, 1-2 páginas (entrada.paginas) y cornisa en `titulo`. */
export const VERSION_PAGINA = 2;

/** Lo que se publica en /p/[id]. */
export interface PaginaPublica extends Omit<ResultadoOk, "imagenes" | "ok" | "id"> {
  version: number;
  id: string;
  /** ISO 8601 (UTC). */
  creada: string;
}

export interface Almacen {
  nombre: string;
  guardar(p: PaginaPublica): Promise<void>;
  leer(id: string): Promise<PaginaPublica | null>;
}

const ALFABETO = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
/** Id corto, aleatorio y sin caracteres ambiguos (≈ 58 bits con 10 caracteres). */
export function nuevoId(largo = 10): string {
  const b = crypto.getRandomValues(new Uint8Array(largo));
  let s = "";
  for (let i = 0; i < largo; i++) s += ALFABETO[b[i] % ALFABETO.length];
  return s;
}

export const ID_VALIDO = /^[2-9a-zA-Z]{6,24}$/;

/** Arma la versión pública: descarta imágenes IA (pesadas) y los prompts. */
export function paginaPublica(r: ResultadoOk, id = nuevoId(), ahora = new Date()): PaginaPublica {
  const { imagenes: _i, ok: _o, id: _id, ...resto } = r;
  return { ...structuredClone(resto), version: VERSION_PAGINA, id, creada: ahora.toISOString() };
}

/** Valida lo leído (datos viejos o corruptos → null en vez de romper la página). */
export function parecePagina(x: unknown): x is PaginaPublica {
  const p = x as PaginaPublica;
  return !!p && typeof p === "object" && typeof p.id === "string" && Array.isArray(p.entrada?.dias);
}
