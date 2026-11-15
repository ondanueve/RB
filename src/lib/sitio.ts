/** Nombre visible del proyecto (en minúsculas, tal cual). */
export const NOMBRE_SITIO = "rayo borgesdebioyizador";
export const MARCA = "Parodia · Ficción";
/** Sitio estático publicado (GitHub Pages del repo ondanueve/RB). */
export const SITIO_POR_DEFECTO = "https://ondanueve.github.io/RB";
/** Repositorio fuente en GitHub. */
export const REPOSITORIO_GITHUB = "https://github.com/ondanueve/RB";
/** Backend de funciones para el sitio estático en GitHub Pages. */
export const SUPABASE_FUNCTIONS_API = "https://xhewdrhfofwpzfogthai.supabase.co/functions/v1";

let baseAbsoluta: string | null = null;
/**
 * Raíz del sitio publicado, absoluta (p. ej. https://ondanueve.github.io/RB/).
 * Las páginas /d/<id>/ definen window.__RB_BASE__ = "../../"; se resuelve una sola vez
 * al arrancar (main.tsx), antes de que history.pushState cambie la URL.
 */
export function baseSitio(): string {
  if (baseAbsoluta) return baseAbsoluta;
  if (typeof window === 'undefined') return `${SITIO_POR_DEFECTO}/`;
  const rel = (window as unknown as { __RB_BASE__?: string }).__RB_BASE__ ?? './';
  baseAbsoluta = new URL(rel, window.location.href).href.replace(/[?#].*$/, '');
  return baseAbsoluta;
}
