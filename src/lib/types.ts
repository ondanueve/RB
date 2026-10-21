import type { DatosVitales, ChequeoFecha } from "./dates";
import type { Parametros } from "./schema";

export interface Fuente {
  titulo: string;
  url: string;
}

export interface Persona extends DatosVitales {
  /** ¿Es una figura pública reconocible? */
  conocido: boolean;
  descripcion?: string;
  /** Apodos o formas de trato DOCUMENTADAS y de época (vacío si no hay certeza). */
  apodos: string[];
  /** Apellido con el que se lo nombra ("Messi", "Bioy Casares"). Si falta, la última palabra del nombre. */
  apellido?: string;
}

export interface Validacion {
  aceptado: boolean;
  justificacion: string;
  /** Descripción breve de la relación personal documentada. */
  relacion: string;
  /** Inicio documentado de la relación ("AAAA", "AAAA-MM" o "AAAA-MM-DD"). */
  inicioRelacion: string | null;
  /** true si la fecha de inicio no está documentada con precisión (se usa la más conservadora). */
  inicioAproximado: boolean;
  /** Ámbito principal (literatura, fútbol, música, política, cine...). */
  ambito: string;
  borges: Persona;
  bioy: Persona;
  /** Criticados/alabados/presentes que no se pudieron verificar como figuras públicas. */
  noVerificados: string[];
  fuentes: Fuente[];
  conBusquedaWeb: boolean;
}

export interface Hecho {
  fecha: string;
  descripcion: string;
}

export interface Contexto {
  /** Rango cubierto por el contexto (incluye todas las entradas de la página). */
  desde: string;
  hasta: string;
  resumen: string;
  /** Hechos ocurridos en los días/semanas previos a la fecha. */
  recientes: Hecho[];
  /** Eventos programados o inminentes después de la fecha. */
  proximos: Hecho[];
  /** Fechas sugeridas para las entradas (el pipeline las valida y corrige). */
  fechasSugeridas: string[];
  /** Escena sugerida si el usuario no eligió una. */
  escenaSugerida?: string;
  /** Criticados/alabados sugeridos si el usuario no los indicó. */
  criticadosSugeridos: string[];
  alabadosSugeridos: string[];
  fuentes: Fuente[];
  conBusquedaWeb: boolean;
}

/** Una entrada del diario (un día). */
export interface EntradaDia {
  /** AAAA-MM-DD. La elige el pipeline (nunca la inventa el modelo sin control). */
  fecha: string;
  /** Año ("1957"); se imprime como encabezado cuando cambia. */
  anio: string;
  /** Encabezado calculado sin IA ("Martes, 14 de junio."). */
  encabezado: string;
  /** Primera línea situacional, adaptada a la escena ("Come en casa.", "Llama por teléfono."). */
  situacion: string;
  parrafos: string[];
}

/** El diario generado: 1 o 2 páginas, cada una con 2 a 4 entradas breves y consecutivas. */
export interface Entrada {
  dias: EntradaDia[];
  /**
   * Cuántas entradas (de `dias`, en orden) van en cada página: [3, 2] = dos páginas
   * enfrentadas. Si falta (páginas guardadas antes del cambio), todo es una sola página.
   */
  paginas?: number[];
  /** Notas al pie del "editor" (opcionales; se imprimen en la última página). */
  notas: string[];
  /** Escena de la primera entrada. */
  escena: string;
  criticados: string[];
  alabados: string[];
  /** Palabras del cuerpo (todas las páginas, sin notas). */
  palabras: number;
  /** Autorrevisión: si se hizo una segunda pasada y qué problemas quedaron. */
  revision: { hecha: boolean; problemasDetectados: string[]; problemasRestantes: string[] };
}

/** Tapa de la edición (OBSOLETO: solo existe en páginas guardadas antes de quitar la tapa). */
export interface Edicion {
  titulo: string;
  autor?: string;
  editorial?: string;
  coleccion?: string;
  tomo?: string;
  anio?: number;
}

export interface Imagen {
  /** data URL (image/png, image/jpeg o image/svg+xml). */
  dataUrl: string;
  proveedor: string;
  prompt: string;
}

export interface ResultadoOk {
  ok: true;
  parametros: Parametros;
  validacion: Validacion;
  chequeoFecha: ChequeoFecha;
  /** Fechas de las entradas de la página (todas verificadas con chequearFecha). */
  fechas: string[];
  contexto: Contexto;
  entrada: Entrada;
  /** Cornisa (título corrido) de las páginas: el apellido del "Borges". */
  titulo: string;
  /** OBSOLETOS: tapa y diseño de páginas viejas; se ignoran al mostrar. */
  edicion?: Edicion;
  diseno?: string;
  /** Imagen IA de la página (opcional; por defecto IMAGE_PROVIDER=none y no se genera). */
  imagenes: { pagina: Imagen | null };
  /** Permalink, si se pudo guardar (ver lib/storage). */
  id?: string;
  proveedores: { texto: string; imagen: string };
  advertencias: string[];
}

export interface ResultadoRechazo {
  ok: false;
  etapa: "parametros" | "validacion" | "fecha";
  mensaje: string;
  errores?: { campo: string; mensaje: string }[];
  validacion?: Validacion;
  chequeoFecha?: ChequeoFecha;
}

export type Resultado = ResultadoOk | ResultadoRechazo;
