/**
 * Opciones del formulario, sin dependencias (el cliente las importa sin cargar zod).
 */
/** Escenas sugeridas. El usuario también puede escribir una escena libre. */
export const ESCENAS_SUGERIDAS = [
  "Cena en casa",
  "Almuerzo en un restaurante",
  "Caminata nocturna por el barrio",
  "Llamada telefónica",
  "Conferencia de prensa",
  "Cena en la concentración",
  "Práctica / entrenamiento",
  "Vestuario post-partido",
  "Llamada telefónica pre-torneo",
  "Viaje (avión, micro, tren)",
  "Rodaje",
  "Ensayo",
  "Camarín antes de la función",
  "Estudio de grabación",
  "Sobremesa en un congreso o festival",
] as const;

export const TONOS = [
  "ácido",
  "melancólico",
  "chismoso",
  "irónico",
  "erudito",
  "tierno",
  "malhumorado",
] as const;

export const EXTENSIONES = ["corta", "media", "larga"] as const;
export type Extension = (typeof EXTENSIONES)[number];
