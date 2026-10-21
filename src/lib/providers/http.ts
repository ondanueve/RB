/** Error HTTP de un proveedor (conserva el status para decidir reintentos). */
export class ErrorHTTP extends Error {
  constructor(mensaje: string, public status: number) {
    super(mensaje);
  }
}

/**
 * Prueba una lista de modelos en orden y pasa al siguiente SOLO si el actual no existe /
 * fue retirado (HTTP 404), está saturado (HTTP 503; un pedido rechazado no consume cuota)
 * o no respondió a tiempo (504, timeout local), o agotó SU cuota diaria gratuita por modelo
 * (429 con una cuota "PerModel": cada modelo tiene la suya, así que otro modelo gratuito
 * puede responder sin costo).
 * Cualquier otro error (429 de cuota general, 400...) se propaga tal cual: nunca se
 * reintenta "por las dudas". Recuerda el último modelo que funcionó para probarlo primero.
 */
const modeloElegido = new Map<string, string>();
export async function conModelos<T>(clave: string, modelos: string[], fn: (modelo: string) => Promise<T>): Promise<T> {
  const lista = [...new Set(modelos.filter(Boolean))];
  const previo = modeloElegido.get(clave);
  const orden = previo && lista.includes(previo) ? [previo, ...lista.filter((m) => m !== previo)] : lista;
  let ultimo: unknown;
  let cuota: unknown; // si algún modelo agotó su cuota, ese es el error que importa (no un 404 posterior)
  for (const m of orden) {
    try {
      const r = await fn(m);
      modeloElegido.set(clave, m);
      return r;
    } catch (e) {
      ultimo = e;
      const cuotaDelModelo = e instanceof ErrorHTTP && e.status === 429 && /PerModel/i.test(e.message);
      if (cuotaDelModelo) cuota ??= e;
      if (!(e instanceof ErrorHTTP && (e.status === 404 || e.status === 503 || e.status === 504 || cuotaDelModelo))) throw e;
    }
  }
  throw cuota ?? ultimo ?? new Error("No hay modelos configurados");
}

/** Último modelo que funcionó para esa clave (si hubo alguno). */
export function modeloUsado(clave: string): string | undefined {
  return modeloElegido.get(clave);
}

/** Lista de modelos desde una variable (separada por comas) o los valores por defecto. */
export function listaModelos(valor: string | undefined, defecto: string[]): string[] {
  const v = (valor ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return v.length ? v : defecto;
}

/**
 * Resume un error de la API: mensaje + (si es de Google) las cuotas violadas y el tiempo
 * de reintento. Nunca incluye headers ni la URL completa (que podrían llevar claves).
 */
export function resumirError(texto: string): string {
  try {
    const e = JSON.parse(texto)?.error;
    if (!e) return texto.slice(0, 300);
    const partes = [String(e.message ?? e.status ?? "error").trim().slice(0, 220)];
    for (const d of e.details ?? []) {
      if (String(d["@type"]).endsWith("QuotaFailure")) {
        for (const v of d.violations ?? []) {
          const dims = v.quotaDimensions ? Object.values(v.quotaDimensions).join("/") : "";
          partes.push(`cuota: ${v.quotaId ?? v.quotaMetric}${dims ? ` [${dims}]` : ""}${v.quotaValue != null ? ` límite=${v.quotaValue}` : ""}`);
        }
      }
      if (String(d["@type"]).endsWith("RetryInfo") && d.retryDelay) partes.push(`reintentar en ${d.retryDelay}`);
    }
    return partes.join(" · ");
  } catch {
    return texto.slice(0, 300);
  }
}

/** fetch con timeout y errores legibles (sin filtrar claves en los mensajes). */
export async function postJSON(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  timeoutMs = 55_000,
): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new ErrorHTTP(`HTTP ${res.status} de ${new URL(url).host}: ${resumirError(text)}`, res.status);
    }
    return JSON.parse(text);
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new ErrorHTTP(`Sin respuesta de ${new URL(url).host} en ${Math.round(timeoutMs / 1000)} s (timeout)`, 504);
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

/** Extrae el primer objeto JSON de un texto (tolera ```json ... ``` y texto alrededor). */
export function extraerJSON<T = any>(texto: string): T {
  const limpio = texto.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(limpio);
  } catch {
    const i = limpio.indexOf("{");
    const j = limpio.lastIndexOf("}");
    if (i >= 0 && j > i) return JSON.parse(limpio.slice(i, j + 1));
    throw new Error("La respuesta del modelo no contiene JSON válido");
  }
}
