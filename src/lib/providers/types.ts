import type { Parametros } from "../schema";
import type { Contexto, Entrada, Fuente, Validacion } from "../types";

export type Tarea = "validacion" | "contexto" | "entrada" | "revision";

export interface TextRequest {
  tarea: Tarea;
  system: string;
  user: string;
  /** Pedir grounding con búsqueda web si el proveedor lo soporta. */
  buscarEnWeb: boolean;
  /** Se espera JSON en la respuesta. */
  json: boolean;
  /** Hora límite (epoch ms) para responder; el proveedor acorta su timeout para no pasarla. */
  limite?: number;
  /** Datos estructurados (los usa el proveedor mock para responder sin IA). */
  meta: {
    parametros: Parametros;
    validacion?: Validacion;
    contexto?: Contexto;
    ventana?: { desde: string; hasta: string; n: number };
    fechas?: string[];
    /** Entradas por página. */
    reparto?: number[];
    borrador?: unknown;
    problemas?: string[];
  };
}

export interface TextResponse {
  texto: string;
  fuentes: Fuente[];
  conBusquedaWeb: boolean;
}

export interface TextProvider {
  nombre: string;
  generar(req: TextRequest): Promise<TextResponse>;
}

export interface ImageRequest {
  tipo: "pagina";
  prompt: string;
  /** Relación de aspecto deseada. */
  aspecto: "2:3" | "3:2" | "1:1";
  meta: { titulo: string; entrada: Entrada };
}

export interface ImageResponse {
  /** data URL de la imagen. */
  dataUrl: string;
}

export interface ImageProvider {
  nombre: string;
  generar(req: ImageRequest): Promise<ImageResponse>;
}

/** Variables de entorno relevantes (todas opcionales; sin nada, todo corre en mock). */
export type Env = Record<string, string | undefined>;
