/**
 * Votos del público (me gusta / no me gusta) y lista «más votados», del lado del navegador.
 * Sin cuentas: cada navegador tiene un identificador anónimo al azar (localStorage) y el servidor
 * guarda solo un hash con sal. Las funciones «votar» y «lista2» viven en Supabase.
 */
import { SUPABASE_FUNCTIONS_API } from './sitio';
import { ID_VALIDO } from './storage/tipos';

export type Voto = -1 | 0 | 1;

export interface ConteoVotos {
  likes: number;
  dislikes: number;
  mio: Voto;
}

export interface DiarioListado {
  id: string;
  creada: string;
  titulo: string;
  descripcion: string;
  likes: number;
  dislikes: number;
  puntaje: number;
}

export type Orden = 'votos' | 'recientes';

const CLAVE_VOTANTE = 'bdb-votante';
const CLAVE_VOTOS = 'bdb-votos';

/** Solo diarios guardados en el servidor (los ejemplos precargados no se votan). */
export function sePuedeVotar(id: string | undefined | null): id is string {
  return Boolean(id) && ID_VALIDO.test(id!) && !/^demo\d+borges$/.test(id!);
}

function guardado(): Record<string, Voto> {
  try {
    const x = JSON.parse(localStorage.getItem(CLAVE_VOTOS) ?? '{}');
    return x && typeof x === 'object' ? x : {};
  } catch {
    return {};
  }
}

/** Voto recordado en este navegador (para pintar el botón antes de que conteste el servidor). */
export function votoLocal(id: string): Voto {
  const v = guardado()[id];
  return v === 1 || v === -1 ? v : 0;
}

export function recordarVoto(id: string, v: Voto) {
  try {
    const m = guardado();
    if (v === 0) delete m[id];
    else m[id] = v;
    localStorage.setItem(CLAVE_VOTOS, JSON.stringify(m));
  } catch {
    /* sin localStorage: el voto igual queda en el servidor */
  }
}

/** Identificador anónimo de este navegador (al azar; no dice nada de quien vota). */
export function votante(): string {
  try {
    let v = localStorage.getItem(CLAVE_VOTANTE);
    if (!v || !/^[0-9a-zA-Z_-]{16,64}$/.test(v)) {
      const b = new Uint8Array(16);
      crypto.getRandomValues(b);
      v = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(CLAVE_VOTANTE, v);
    }
    return v;
  } catch {
    return 'sin-almacenamiento-' + Math.random().toString(36).slice(2, 14);
  }
}

export async function leerVotos(id: string): Promise<ConteoVotos> {
  const r = await fetch(`${SUPABASE_FUNCTIONS_API}/votar?id=${encodeURIComponent(id)}&v=${encodeURIComponent(votante())}`, { cache: 'no-store' });
  const d = await r.json();
  if (!r.ok || !d.ok) throw new Error(d?.mensaje || 'No se pudieron leer los votos.');
  return { likes: d.likes, dislikes: d.dislikes, mio: d.mio };
}

export async function enviarVoto(id: string, valor: Voto): Promise<ConteoVotos> {
  const r = await fetch(`${SUPABASE_FUNCTIONS_API}/votar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, v: votante(), valor }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.ok) throw new Error(d?.mensaje || 'No se pudo guardar el voto.');
  return { likes: d.likes, dislikes: d.dislikes, mio: d.mio };
}

export async function listarDiarios(orden: Orden): Promise<DiarioListado[]> {
  const r = await fetch(`${SUPABASE_FUNCTIONS_API}/lista2?orden=${orden}`, { cache: 'no-store' });
  const d = await r.json();
  if (!r.ok || !d.ok || !Array.isArray(d.paginas)) throw new Error(d?.mensaje || 'No se pudo cargar la lista.');
  return d.paginas;
}
