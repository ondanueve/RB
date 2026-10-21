/**
 * Chequeos de estilo SIN IA sobre una página ya escrita.
 * Detectan monólogos, citas ambiguas sin atribución de interlocutor, encabezados de diálogo
 * que no estén en mayúsculas («APELLIDO: «…»»), fórmulas retóricas repetidas, acotaciones
 * novelescas ajenas al tono de cuaderno seco, verbos dicendi melodramáticos, explicaciones del
 * chiste, clichés seudoborgianos fuera de lugar, palabras repetidas en los encabezados, páginas
 * fuera de medida, vocativos entre los dos protagonistas y el "Borges" nombrado en la narración
 * por el nombre de pila o un apodo.
 */
import type { EntradaDia, Persona } from "./types";
import { apellidoDe, partir } from "./paginas";

export const MAX_ORACIONES_POR_CITA = 2;

/** Fórmulas que se vuelven tics si aparecen más de una vez en el mismo diario. */
export const FORMULAS_VIGILADAS = [
  "creen que",
  "cree que",
  "esa gente",
  "esta gente",
  "son unos",
  "es incapaz de",
  "tienen el",
  "lo que pasa es que",
  "el problema es que",
  "en el fondo",
  "la verdad es que",
  "no es que",
  "confunde",
  "confunden",
  "como si fuera",
  "no deja de ser",
  "el error de",
  "la mania de",
];

/**
 * Giros de novela mala, verbos dicendi teatrales o explicaciones de la ironía que arruinan
 * la sequedad de cuaderno de Bioy Casares. Si aparecen una sola vez, se exige eliminarlos.
 */
export const GIROS_NOVELESCOS_PROHIBIDOS = [
  "esboza una sonrisa",
  "esbozando una sonrisa",
  "sonrisa enigmatica",
  "mirada perdida",
  "clava la mirada",
  "suspira profundamente",
  "hace una pausa dramatica",
  "silencio sepulcral",
  "un silencio incomodo",
  "el silencio se apodera",
  "tono reflexivo",
  "aire pensativo",
  "brillo en los ojos",
  "lanza una carcajada",
  "no puedo evitar pensar",
  "me quedo pensando en",
  "comprendi que",
  "en ese instante supe",
  "como un eco",
  "el peso de la historia",
  "con ironia",
  "ironicamente",
  "en tono de broma",
  "replica con ironia",
  "sentencia con gravedad",
  "murmura para si",
  "susurra",
  "confiesa emocionado",
  "hablamos largo y tendido",
  "la conversacion gira en torno",
  "intercambiamos opiniones",
  "reflexionamos sobre",
  "como buen ",
  "cabe destacar",
  "resulta curioso",
  "no deja de sorprender",
];

/**
 * Tópicos escolares de Jorge Luis Borges que un modelo perezoso mete en boca de futbolistas,
 * músicos o políticos. Prohibidos salvo que el protagonista sea literalmente Borges.
 */
export const TOPICOS_AJENOS_A_NO_BORGES = [
  "laberinto",
  "laberintos",
  "aleph",
  "espejos infinitos",
  "biblioteca infinita",
  "eternidad circular",
  "tigres azules",
];

const STOP = new Set(
  (
    "de la que el en y a los se del las un por con no una su para es al lo como más pero sus le ya o este sí porque esta " +
    "entre cuando muy sin sobre también me hasta hay donde quien desde todo nos durante todos uno les ni contra otros ese eso " +
    "ante ellos e esto mí antes algunos qué unos yo otro otras otra él tanto esa estos mucho quienes nada muchos cual poco " +
    "ella estar estas algunas algo nosotros mi mis tú te ti tu tus ellas nosotras vosotros os mío mía tuyo suyo nuestro " +
    "dice digo después luego entonces aunque mientras"
  ).split(/\s+/),
);

const VERBOS_INTRODUCTORIOS = new Set([
  "dice",
  "digo",
  "agrega",
  "agrego",
  "observa",
  "observo",
  "comenta",
  "comento",
  "contesta",
  "contesto",
  "pregunta",
  "pregunto",
  "repite",
  "repito",
  "lee",
  "leo",
  "anota",
  "anoto",
  "escribe",
  "escribo",
  "concluye",
  "concluyo",
  "resume",
  "resumo",
  "sugiere",
  "sugiero",
  "propone",
  "propongo",
  "recuerda",
  "recuerdo",
  "corrige",
  "corrijo",
  "sostiene",
  "sostengo",
  "afirma",
  "afirmo",
  "objeta",
  "objeto",
  "explica",
  "explico",
  "anuncia",
  "anuncio",
  "advierte",
  "advierto",
  "insiste",
  "insisto",
  "admite",
  "admito",
  "confiesa",
  "confieso",
  "responde",
  "respondo",
  "empieza",
  "termina",
  "remata",
  "murmura",
  "exclama",
  "grita",
  "pide",
  "ordena",
  "sentencia",
]);

export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function contarPalabras(dias: Pick<EntradaDia, "situacion" | "parrafos">[]): number {
  return dias.reduce(
    (n, d) => n + [d.situacion, ...d.parrafos].join(" ").split(/\s+/).filter(Boolean).length,
    0,
  );
}

function oraciones(texto: string): string[] {
  return texto
    .split(/(?<=[.!?…])\s+(?=[«"“—A-ZÁÉÍÓÚÑ¿¡])/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Citas entre comillas latinas, inglesas o rectas. */
export function citas(texto: string): string[] {
  const out: string[] = [];
  for (const m of texto.matchAll(/«([^»]+)»|“([^”]+)”|"([^"]+)"/g)) {
    out.push((m[1] ?? m[2] ?? m[3]).trim());
  }
  return out;
}

function contenido(s: string): string[] {
  return normalizar(s)
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !STOP.has(w));
}

type Quien = Pick<Persona, "nombre" | "apodos"> & { apellido?: string };

export interface OpcionesEstilo {
  borges: Quien;
  bioy: Quien;
  /** Rango de palabras de CADA página. */
  palabras: [number, number];
  /** Entradas por página (por defecto, todas en una). */
  reparto?: number[];
}

const escaparRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const L = "\\p{L}";

/** Formas con las que uno de los dos podría ser llamado: nombre, partes del nombre, apellido y apodos. */
function formasDe(q: Quien): string[] {
  const partes = q.nombre.split(/\s+/).filter((w) => w.length >= 3);
  return [
    ...new Set(
      [q.nombre, ...partes, apellidoDe(q), ...q.apodos]
        .map((x) => x.trim())
        .filter((x) => x.length >= 3),
    ),
  ];
}

/** Texto narrativo: todo lo que no está entre comillas. */
function narracion(texto: string): string {
  return texto.replace(/«[^»]*»|“[^”]*”|"[^"]*"/g, " … ");
}

/**
 * Normaliza en un párrafo los encabezados de diálogo tipo `Apellido: «Texto»` o `Yo: «Texto»`
 * para que el apellido o pronombre vaya SIEMPRE en mayúsculas (`APELLIDO: «Texto»`, `YO: «Texto»`),
 * como en la edición del libro "Borges" de Bioy Casares.
 */
export function normalizarEncabezadosDialogo(
  texto: string,
  borges: Quien,
  bioy: Quien,
): string {
  const apB = apellidoDe(borges);
  const apY = apellidoDe(bioy);
  const candidatos = [apB, apY, "Yo"].filter(Boolean);
  let res = texto;
  for (const c of candidatos) {
    const re = new RegExp(`(^|[.!?…]\\s+)${escaparRe(c)}\\s*:\\s*(?=[«"“])`, "giu");
    res = res.replace(re, (_m, pref) => `${pref}${c.toUpperCase()}: `);
  }
  return res;
}

/**
 * Vocativos dentro de una cita: «Gringo, ponelo…», «…, Scaloni.», «¡Leo!».
 * Devuelve la forma encontrada o null.
 */
export function vocativoEn(cita: string, formas: string[]): string | null {
  for (const f of formas) {
    const base = f.replace(/^(el|la|los|las)\s+/i, "");
    const nucleo = escaparRe(base);
    const re = new RegExp(
      `(^|[¡¿]\\s*)(?:${nucleo})\\s*[,!]|[,;]\\s*(?:${nucleo})\\s*([.,!?…;]|$)|¡\\s*(?:${nucleo})\\s*!`,
      "iu",
    );
    if (re.test(cita.trim())) return f;
  }
  return null;
}

export function detectarProblemas(
  dias: Pick<EntradaDia, "situacion" | "parrafos">[],
  o: OpcionesEstilo,
): string[] {
  const problemas: string[] = [];
  const cuerpo = dias.map((d) => d.parrafos.join(" "));
  const todo = cuerpo.join(" ");
  const apB = apellidoDe(o.borges).toUpperCase();
  const apY = apellidoDe(o.bioy).toUpperCase();

  // 1. Extensión: cada página entra en una página impresa.
  const reparto =
    o.reparto && o.reparto.reduce((a, b) => a + b, 0) === dias.length
      ? o.reparto
      : [dias.length];
  partir(dias, reparto).forEach((pag, i) => {
    const n = contarPalabras(pag);
    const cual = reparto.length > 1 ? `La página ${i + 1}` : "La página";
    if (n > Math.round(o.palabras[1] * 1.1)) {
      problemas.push(`${cual} tiene ${n} palabras; el máximo es ${o.palabras[1]}. Acortá.`);
    }
    if (n < Math.round(o.palabras[0] * 0.6)) {
      problemas.push(`${cual} tiene solo ${n} palabras; el mínimo es ${o.palabras[0]}.`);
    }
  });

  // 2. Monólogos: ninguna cita de más de 2 oraciones, y cada entrada debe tener diálogo citado.
  dias.forEach((d, idx) => {
    const textoDia = d.parrafos.join(" ");
    if (citas(textoDia).length === 0) {
      problemas.push(
        `La entrada ${idx + 1} no tiene ninguna cita textual entre «»: incluí diálogo directo.`,
      );
    }
  });

  for (const c of citas(todo)) {
    const k = oraciones(c).length;
    if (k > MAX_ORACIONES_POR_CITA) {
      problemas.push(
        `Cita demasiado larga (${k} oraciones; máximo ${MAX_ORACIONES_POR_CITA}): «${c.slice(0, 70)}…». Partila en un ida y vuelta con ${apB}: / ${apY}: o recortala.`,
      );
    }
  }
  for (const m of todo.matchAll(/—([^—«»]{40,})/g)) {
    const k = oraciones(m[1]).length;
    if (k > MAX_ORACIONES_POR_CITA + 1) {
      problemas.push(
        `Parlamento con raya demasiado largo: «${m[1].trim().slice(0, 60)}…». Usá «» con ${apB}: / ${apY}: y cortá en intercambios.`,
      );
    }
  }

  // 2b. Encabezados de cita con formato APELLIDO: «Texto» siempre en MAYÚSCULAS y prohibición de citas huérfanas.
  for (const d of dias) {
    for (const p of d.parrafos) {
      // Detectar etiquetas antes de `: «` que no estén en mayúsculas y no sean un verbo introductorio
      for (const m of p.matchAll(/(?:^|[.!?…]\s+)([A-ZÁÉÍÓÚÑ][\p{L}\s]{1,22}):\s*[«"“]/gu)) {
        const etq = m[1].trim();
        const ultPalabra = normalizar(etq.split(/\s+/).pop() ?? "");
        if (!VERBOS_INTRODUCTORIOS.has(ultPalabra) && etq !== etq.toUpperCase()) {
          problemas.push(
            `El encabezado de diálogo «${etq}:» debe ir todo en mayúsculas: «${etq.toUpperCase()}: «…»».`,
          );
        }
      }
      // Detectar oraciones que empiezan directamente con «Cita» sin `APELLIDO:` antes ni verbo dicendi explícito después
      for (const s of oraciones(p)) {
        if (/^[«"“]/.test(s)) {
          const postCita = s.replace(/^[«"“][^»"”]+[»"”]\s*/, "").trim();
          const tieneAtribucionPost =
            /^[,—]?\s*(dice|digo|contesta|contesto|corrige|corrijo|comenta|comento|agrega|agrego|observa|observo|pregunta|pregunto|repite|repito|sostiene|advierte|propone|concluye)\b/i.test(
              normalizar(postCita),
            );
          if (!tieneAtribucionPost) {
            problemas.push(
              `Cita ambigua sin interlocutor explícito (${s.slice(0, 55)}…): no se entiende si habla ${apB} o ${apY}. Antepone «${apB}: » o «${apY}: » (en mayúsculas).`,
            );
          }
        }
      }
    }
  }

  // 3. Fórmulas repetidas y giros novelescos prohibidos.
  const norm = normalizar(todo);
  for (const f of FORMULAS_VIGILADAS) {
    const veces = norm.split(new RegExp(`\\b${normalizar(f)}\\b`)).length - 1;
    if (veces >= 2) {
      problemas.push(`La fórmula «${f}» aparece ${veces} veces; dejala a lo sumo una.`);
    }
  }
  for (const giro of GIROS_NOVELESCOS_PROHIBIDOS) {
    if (norm.includes(normalizar(giro))) {
      problemas.push(
        `Aparece el giro «${giro}», impropio del cuaderno seco del diarista. Reemplazalo por atribución directa («${apB}: «…»») o un hecho concreto.`,
      );
    }
  }

  // 3b. Clichés seudoborgianos cuando el protagonista no es Jorge Luis Borges.
  const esBorgesReal = normalizar(o.borges.nombre).includes("borges");
  if (!esBorgesReal) {
    for (const topico of TOPICOS_AJENOS_A_NO_BORGES) {
      if (new RegExp(`\\b${normalizar(topico)}\\b`).test(norm)) {
        problemas.push(
          `El texto usa la palabra «${topico}»: ${o.borges.nombre} no debe hablar con tópicos literarios de Jorge Luis Borges (laberintos, espejos, Aleph), sino con el vocabulario de su propio oficio.`,
        );
      }
    }
  }

  // 4. Comienzos de oración repetidos (dos primeras palabras) y oraciones duplicadas.
  const nombres = new Set(
    [o.borges.nombre, o.bioy.nombre, ...o.borges.apodos, ...o.bioy.apodos]
      .flatMap((x) => normalizar(x).split(/\s+/))
      .filter(Boolean),
  );
  const aperturas = new Map<string, number>();
  const oracionesVistas = new Set<string>();
  for (const s of oraciones(todo.replace(/[«»“”"]/g, ""))) {
    const sinEtiqueta = s.replace(/^[A-ZÁÉÍÓÚÑÜ\s]{2,25}:\s*/u, "");
    const sNorm = normalizar(sinEtiqueta).replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    if (sNorm.length >= 25) {
      if (oracionesVistas.has(sNorm)) {
        problemas.push(`Oración repetida dentro del diario: «${s.slice(0, 60)}…».`);
      }
      oracionesVistas.add(sNorm);
    }
    const w = sNorm
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    if (w.length < 2) continue;
    const clave = w.join(" ");
    aperturas.set(clave, (aperturas.get(clave) ?? 0) + 1);
  }
  for (const [clave, veces] of aperturas) {
    const conNombre = clave.split(" ").some((w) => nombres.has(w)) || /^(le|me|yo) /.test(clave);
    if (veces >= (conNombre ? 5 : 2)) {
      problemas.push(
        `Varias oraciones empiezan igual («${clave}…», ${veces} veces); variá los comienzos.`,
      );
    }
  }

  // 5. Palabras repetidas en los encabezados/situaciones y entre la situación y el arranque de su entrada.
  const vistos = new Map<string, number>();
  dias.forEach((d, i) => {
    const ws = contenido(d.situacion).filter((w) => !nombres.has(w));
    const sit = new Set(ws);
    for (const w of sit) {
      if (vistos.has(w)) {
        problemas.push(
          `La palabra «${w}» se repite en las líneas de situación de las entradas ${vistos.get(w)! + 1} y ${i + 1}.`,
        );
      } else {
        vistos.set(w, i);
      }
    }
    const primera = oraciones(d.parrafos[0] ?? "")[0] ?? "";
    for (const w of new Set(contenido(primera))) {
      if (sit.has(w)) {
        problemas.push(
          `En la entrada ${i + 1}, «${w}» está en la situación y otra vez en la primera oración; evitá la repetición.`,
        );
      }
    }
    const sitTexto = normalizar(d.situacion);
    if (new Set(ws).size < ws.length) {
      problemas.push(`La situación de la entrada ${i + 1} repite palabras: «${d.situacion}».`);
    }
    if (sitTexto.split(/[.;]/).filter((x) => x.trim()).length > 2) {
      problemas.push(
        `La situación de la entrada ${i + 1} es demasiado larga; dejala en una línea seca.`,
      );
    }
  });

  // 6. Vocativos entre los dos: no se llaman por el nombre ni por apodos; se dicen las cosas directamente.
  const formas = [...formasDe(o.borges), ...formasDe(o.bioy)].sort((a, b) => b.length - a.length);
  for (const c of citas(todo)) {
    const v = vocativoEn(c, formas);
    if (v) {
      problemas.push(
        `En «${c.slice(0, 60)}» hay un vocativo («${v}»). ${o.borges.nombre} y ${o.bioy.nombre} no se llaman por el nombre ni por apodos: sacalo y que la frase se diga directamente.`,
      );
    }
  }

  // 7. En la narración, el "Borges" se nombra por el apellido, nunca por el nombre de pila ni un apodo.
  const apellido = apellidoDe(o.borges);
  const tokApellido = new Set(apellido.split(/\s+/).map(normalizar));
  const prohibidas = [
    ...o.borges.nombre
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !tokApellido.has(normalizar(w))),
    ...o.borges.apodos.filter((a) => normalizar(a) !== normalizar(apellido)),
  ];
  const textoNarrado = narracion([...dias.map((d) => d.situacion), ...cuerpo].join(" \n ")).replace(
    new RegExp(escaparRe(o.borges.nombre), "giu"),
    " ",
  );
  for (const f of [...new Set(prohibidas)]) {
    const base = f.replace(/^(el|la|los|las)\s+/i, "");
    const cap = base.charAt(0).toUpperCase() + base.slice(1);
    const re = new RegExp(`(?<!${L})${escaparRe(cap)}(?!${L})`, "u");
    if (re.test(textoNarrado)) {
      problemas.push(
        `En la narración se nombra a ${o.borges.nombre} como «${f}»: el diarista lo nombra siempre por el apellido («${apellido}»).`,
      );
    }
  }

  return [...new Set(problemas)];
}
