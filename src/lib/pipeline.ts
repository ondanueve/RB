/**
 * Pipeline completo:
 *   1. Parámetros (zod)  2. Identificación de personas/relación  3. Chequeo de fecha
 *   4. Contexto histórico  5. Escritura (1-2 páginas, en una sola llamada) + revisión
 *   6. Imagen de la página (opcional; por defecto no se genera)
 *
 * En caso de combinaciones o fechas no verosímiles (ucronías, anacronismos o cruces
 * imaginarios), el pipeline registra la advertencia y procede igual componiendo el diario.
 */
import { z } from "zod";
import { parsearParametros, type Parametros } from "./schema";
import { chequearFecha, encabezadoDeAnio, encabezadoDeEntrada, fechasDePagina, finDeVentana, sumarDias } from "./dates";
import { contarPalabras, detectarProblemas, normalizarEncabezadosDialogo } from "./estilo";
import { ENTRADAS_MAX, ENTRADAS_MIN, PALABRAS_POR_EXTENSION, VENTANA_DIAS } from "./schema";
import { apellidoDe, partir } from "./paginas";
import { imageProvider, textProvider, type Env } from "./providers";
import type { ImageProvider, TextProvider } from "./providers/types";
import { extraerJSON } from "./providers/http";
import { mockImage } from "./providers/image/mock";
import { promptContexto, promptEntrada, promptPagina, promptRevision, promptValidacion } from "../prompts";
import type { Contexto, Entrada, Fuente, Imagen, Persona, Resultado, Validacion } from "./types";

/* ---- Esquemas tolerantes para la salida de los modelos ---- */

const str = z.preprocess((v) => (v == null ? "" : String(v)), z.string());
const strOrNull = z.preprocess((v) => (v == null || v === "" ? null : String(v)), z.string().nullable());
const strList = z.preprocess(
  (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : []),
  z.array(z.string()),
);
const fuentes = z.preprocess(
  (v) => (Array.isArray(v) ? v.filter((f) => f && typeof f.url === "string" && /^https?:\/\//.test(f.url)) : []),
  z.array(z.object({ titulo: str, url: z.string() })),
);
const persona = z.object({
  nombre: str,
  conocido: z.boolean().catch(true),
  descripcion: str.optional(),
  nacimiento: strOrNull.optional(),
  muerte: strOrNull.optional(),
  apodos: strList,
  apellido: z.preprocess((v) => (v == null || String(v).trim() === "" ? undefined : String(v).trim()), z.string().optional()),
});
const hechos = z.preprocess(
  (v) => (Array.isArray(v) ? v : []),
  z.array(z.object({ fecha: str, descripcion: str })),
);

const validacionOut = z.object({
  aceptado: z.boolean().catch(true),
  justificacion: str,
  relacion: str,
  inicioRelacion: strOrNull,
  inicioAproximado: z.boolean().catch(false).default(false),
  ambito: str,
  borges: persona,
  bioy: persona,
  noVerificados: strList,
  fuentes,
});

const contextoOut = z.object({
  fechasSugeridas: strList,
  resumen: str,
  recientes: hechos,
  proximos: hechos,
  escenaSugerida: str.optional(),
  criticadosSugeridos: strList,
  alabadosSugeridos: strList,
  fuentes,
});

const diaOut = z.object({
  fecha: str,
  situacion: str,
  parrafos: z.preprocess(
    (v) => (typeof v === "string" ? v.split(/\n\s*\n/) : v),
    z.array(z.string()).min(1),
  ),
});

const entradaOut = z.object({
  dias: z.array(diaOut).min(1),
  notas: strList,
  escena: str,
  criticados: strList,
  alabados: strList,
});
type EntradaOut = z.infer<typeof entradaOut>;

function limpiarDias(e: EntradaOut, fechas: string[], borges: Persona, bioy: Persona) {
  return e.dias.slice(0, fechas.length).map((d, i) => ({
    fecha: fechas[i],
    anio: encabezadoDeAnio(fechas[i]),
    encabezado: encabezadoDeEntrada(fechas[i]),
    situacion: d.situacion.trim().replace(/\s+/g, " "),
    parrafos: d.parrafos
      .map((s) => normalizarEncabezadosDialogo(s.trim(), borges, bioy))
      .filter(Boolean),
  }));
}

const SUP_NOTAS = ["¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];

function asegurarLlamadasNotas(
  dias: ReturnType<typeof limpiarDias>,
  notas: string[],
): ReturnType<typeof limpiarDias> {
  if (!notas.length || !dias.length) return dias;
  const copia = dias.map((d) => ({ ...d, parrafos: [...d.parrafos] }));
  const todo = () => copia.map((d) => `${d.situacion} ${d.parrafos.join(" ")}`).join(" ");

  notas.forEach((nota, idx) => {
    const sup = SUP_NOTAS[idx];
    const num = idx + 1;
    if (!sup) return;
    if (todo().includes(sup) || todo().includes(`[${num}]`)) return;

    const claves = nota
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^\p{L}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 5);

    let mejorDia = Math.min(idx === 0 ? 0 : copia.length - 1, copia.length - 1);
    let mejorPar = 0;
    let mejorPuntaje = 0;

    copia.forEach((d, di) => {
      d.parrafos.forEach((p, pi) => {
        const pNorm = p.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
        const pts = claves.reduce((acc, w) => acc + (pNorm.includes(w) ? 1 : 0), 0);
        if (pts > mejorPuntaje) {
          mejorPuntaje = pts;
          mejorDia = di;
          mejorPar = pi;
        }
      });
    });

    const pOriginal = copia[mejorDia]?.parrafos[mejorPar];
    if (pOriginal) {
      copia[mejorDia].parrafos[mejorPar] = pOriginal.replace(/([.;])/, `${sup}$1`);
    }
  });

  return copia;
}

function marcarSinVerificar(fs: Fuente[], conBusqueda: boolean): Fuente[] {
  return conBusqueda ? fs : fs.map((f) => ({ ...f, titulo: `${f.titulo} (citada por el modelo, sin verificar)` }));
}

function unirFuentes(a: Fuente[], b: Fuente[]): Fuente[] {
  const vistos = new Set<string>();
  return [...a, ...b].filter((f) => (vistos.has(f.url) ? false : (vistos.add(f.url), true))).slice(0, 12);
}

export interface Opciones {
  env?: Env;
  azar?: () => number;
  texto?: TextProvider;
  imagen?: ImageProvider | null;
  hoy?: Date;
  plazoMs?: number;
  limiteMs?: number;
}

export function repartir(pedido: number[], n: number): number[] {
  const totalPedido = pedido.reduce((a, b) => a + b, 0);
  if (pedido.length > 1 && n < totalPedido) {
    const k = pedido.length;
    const base = Math.floor(n / k);
    let extra = n % k;
    return pedido.map(() => {
      const add = extra > 0 ? 1 : 0;
      if (extra > 0) extra--;
      return Math.max(1, base + add);
    });
  }
  const out: number[] = [];
  let resto = n;
  for (const k of pedido) {
    if (resto <= 0) break;
    const t = Math.min(k, resto);
    out.push(t);
    resto -= t;
  }
  if (out.length > 1 && out[out.length - 1] < 2) {
    const ult = out.pop()!;
    out[out.length - 1] += ult;
  }
  return out.length ? out : [n];
}

export async function generar(input: unknown, opts: Opciones = {}): Promise<Resultado> {
  const inicio = Date.now();
  const env = opts.env ?? (globalThis as { process?: { env: Env } }).process?.env ?? {};
  const advertencias: string[] = [];

  // 1. Parámetros
  const pr = parsearParametros(input);
  if (!pr.ok) {
    return { ok: false, etapa: "parametros", mensaje: "Hay parámetros inválidos.", errores: pr.errores };
  }
  const p: Parametros = pr.data;
  const texto = opts.texto ?? textProvider(env);
  const imagen = opts.imagen !== undefined ? opts.imagen : imageProvider(env);

  // 2. Identificación y validación (procede siempre, incluso en cruces ucrónicos o no verificados)
  const rv = await texto.generar({
    tarea: "validacion",
    ...promptValidacion(p),
    buscarEnWeb: true,
    json: true,
    meta: { parametros: p },
  });
  const vRaw = validacionOut.parse(extraerJSON(rv.texto));
  const borgesPersona: Persona = {
    ...vRaw.borges,
    nombre: vRaw.borges.nombre || p.borges,
    conocido: true,
  };
  const bioyPersona: Persona = {
    ...vRaw.bioy,
    nombre: vRaw.bioy.nombre || p.bioy,
    conocido: true,
  };
  const validacion: Validacion = {
    ...vRaw,
    aceptado: true,
    relacion:
      vRaw.relacion?.trim() ||
      `Conversaciones apócrifas entre ${borgesPersona.nombre} y ${bioyPersona.nombre}.`,
    ambito: vRaw.ambito?.trim() || "cultura",
    borges: borgesPersona,
    bioy: bioyPersona,
    fuentes: unirFuentes(rv.fuentes, marcarSinVerificar(vRaw.fuentes, rv.conBusquedaWeb || texto.nombre === "mock")),
    conBusquedaWeb: rv.conBusquedaWeb,
  };

  if (!vRaw.aceptado) {
    advertencias.push(
      vRaw.justificacion || "Escenario ucrónico o vínculo no documentado; se procede como ficción apócrifa.",
    );
  }

  // 3. Fecha (si es anacrónica o ucrónica, se registra en advertencias y se procede igual)
  const chequeoFecha = chequearFecha(p.fecha, validacion.borges, validacion.bioy, validacion.inicioRelacion, opts.hoy);
  if (!chequeoFecha.ok) {
    for (const m of chequeoFecha.motivos) {
      if (!chequeoFecha.advertencias.includes(m)) chequeoFecha.advertencias.push(m);
    }
    chequeoFecha.ok = true;
  }

  // 3b. Cantidad de entradas y ventana de fechas
  const azar = opts.azar ?? Math.random;
  const sorteo = () => p.entradas ?? ENTRADAS_MIN + Math.floor(azar() * (ENTRADAS_MAX - ENTRADAS_MIN + 1));
  const pedido = Array.from({ length: p.paginas }, sorteo);
  const nPedido = pedido.reduce((a, b) => a + b, 0);
  const ventanaNatural = finDeVentana(
    p.fecha,
    validacion.borges,
    validacion.bioy,
    validacion.inicioRelacion,
    VENTANA_DIAS * p.paginas,
    opts.hoy,
  );
  // Si la fecha es ucrónica/anacrónica, garantizamos igual la ventana completa de días
  const fin = ventanaNatural >= nPedido ? ventanaNatural : VENTANA_DIAS * p.paginas;
  const n = Math.max(1, Math.min(nPedido, fin + 1));
  let reparto = repartir(pedido, n);
  const hasta = sumarDias(p.fecha, Math.max(0, fin));

  // 4. Contexto
  const rc = await texto.generar({
    tarea: "contexto",
    ...promptContexto(p, validacion, { desde: p.fecha, hasta, n }),
    buscarEnWeb: true,
    json: true,
    meta: { parametros: p, validacion, ventana: { desde: p.fecha, hasta, n } },
  });
  const cRaw = contextoOut.parse(extraerJSON(rc.texto));
  const contexto: Contexto = {
    ...cRaw,
    desde: p.fecha,
    hasta,
    fuentes: unirFuentes(rc.fuentes, marcarSinVerificar(cRaw.fuentes, rc.conBusquedaWeb || texto.nombre === "mock")),
    conBusquedaWeb: rc.conBusquedaWeb,
  };

  const fechas = fechasDePagina(cRaw.fechasSugeridas, p.fecha, Math.max(0, fin), n, Math.floor(azar() * 1000));

  // 5. Páginas (1-2, cada una con 2-4 entradas) en UNA llamada + UNA revisión de todo
  if (fechas.length < n) reparto = repartir(reparto, fechas.length);
  const limite = opts.limiteMs != null ? inicio + opts.limiteMs : undefined;
  const re = await texto.generar({
    tarea: "entrada",
    ...promptEntrada(p, validacion, contexto, fechas, reparto),
    buscarEnWeb: false,
    json: true,
    limite,
    meta: { parametros: p, validacion, contexto, fechas, reparto },
  });
  const eRaw = entradaOut.parse(extraerJSON(re.texto));
  let dias = limpiarDias(eRaw, fechas, validacion.borges, validacion.bioy);
  if (dias.length < fechas.length) {
    advertencias.push(`El modelo escribió ${dias.length} de ${fechas.length} entradas.`);
    reparto = repartir(reparto, dias.length);
  }
  let final = eRaw;
  const rangoPalabras = PALABRAS_POR_EXTENSION[p.extension];
  const estilo = { borges: validacion.borges, bioy: validacion.bioy, palabras: rangoPalabras, reparto };
  const problemasDetectados = detectarProblemas(dias, estilo);
  let problemasRestantes = problemasDetectados;
  let revisada = false;

  const sinTiempo = opts.plazoMs != null && Date.now() - inicio > opts.plazoMs;
  if (!sinTiempo && (problemasDetectados.length || texto.nombre !== "mock")) {
    try {
      const rr = await texto.generar({
        tarea: "revision",
        ...promptRevision(
          p,
          validacion,
          { ...eRaw, dias: dias.map(({ fecha, situacion, parrafos }) => ({ fecha, situacion, parrafos })) },
          problemasDetectados,
          reparto,
          contexto,
        ),
        buscarEnWeb: false,
        json: true,
        limite,
        meta: { parametros: p, validacion, contexto, fechas, reparto, borrador: eRaw, problemas: problemasDetectados },
      });
      const rev = entradaOut.parse(extraerJSON(rr.texto));
      const diasRev = limpiarDias(rev, fechas, validacion.borges, validacion.bioy);
      const restantes = detectarProblemas(diasRev, estilo);
      if (diasRev.length === dias.length && restantes.length <= problemasDetectados.length) {
        dias = diasRev;
        final = rev;
        problemasRestantes = restantes;
        revisada = true;
      }
    } catch (e) {
      advertencias.push(`No se pudo hacer la revisión de estilo: ${(e as Error).message}`);
    }
  }
  dias = asegurarLlamadasNotas(dias, final.notas);
  const entrada: Entrada = {
    dias,
    paginas: reparto,
    notas: final.notas,
    escena: final.escena,
    criticados: final.criticados,
    alabados: final.alabados,
    palabras: contarPalabras(dias),
    revision: { hecha: revisada, problemasDetectados, problemasRestantes },
  };

  // 6. Imagen IA de la primera página (opcional)
  const titulo = apellidoDe(validacion.borges);
  const imagenes: { pagina: Imagen | null } = { pagina: null };
  if (imagen) {
    const primera = { dias: partir(dias, reparto)[0] };
    const prompt = promptPagina(titulo, primera);
    const meta = { titulo, entrada: { ...entrada, ...primera } };
    try {
      const r = await imagen.generar({ tipo: "pagina", prompt, aspecto: "2:3", meta });
      imagenes.pagina = { dataUrl: r.dataUrl, proveedor: imagen.nombre, prompt };
    } catch (e) {
      if (imagen.nombre !== "mock") {
        const m = await mockImage().generar({ tipo: "pagina", prompt, aspecto: "2:3", meta });
        imagenes.pagina = { dataUrl: m.dataUrl, proveedor: "mock (respaldo)", prompt };
      }
    }
  }

  return {
    ok: true,
    parametros: p,
    validacion,
    chequeoFecha,
    fechas,
    contexto,
    entrada,
    titulo,
    imagenes,
    proveedores: { texto: texto.nombre, imagen: imagen?.nombre ?? "none" },
    advertencias: [...advertencias, ...chequeoFecha.advertencias],
  };
}
