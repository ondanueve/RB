/**
 * PROMPTS DEL BORGESDEBIOYIZADOR
 * ==============================
 *
 * Todos los textos que se envían a los modelos viven acá, separados del código de
 * proveedores, para poder ajustarlos sin tocar la lógica.
 *
 * Reglas de derechos de autor que atraviesan todo este módulo:
 *  - NO se incluye ningún fragmento del libro "Borges" de Bioy Casares ni de ninguna otra
 *    obra protegida: ni como ejemplo, ni como "few-shot", ni como cita.
 *  - El estilo se describe con palabras propias y en abstracto (entradas fechadas,
 *    diálogo citado, juicios irónicos, chisme, humor seco). Nunca se copia.
 *  - Se le pide al modelo texto ORIGINAL y se le prohíbe reproducir pasajes reales.
 *  - Para las imágenes (opcionales): nada de logos, escudos ni marcas reales.
 */
import type { Parametros } from "../lib/schema";
import { PALABRAS_POR_EXTENSION } from "../lib/schema";
import type { Contexto, Entrada, Validacion } from "../lib/types";
import { apellidoDe, partir } from "../lib/paginas";
import { fechaLarga, encabezadoDeEntrada } from "../lib/dates";

import { MARCA_PARODIA } from "../lib/marca";
export { MARCA_PARODIA };

/* ------------------------------------------------------------------ */
/* Bloques comunes                                                     */
/* ------------------------------------------------------------------ */

/** Descripción abstracta y quirúrgica del estilo de cuaderno íntimo. */
const ESTILO = `
Arquitectura estilística del diario (descripción propia, sin copiar pasajes reales):
- Cuaderno íntimo de un amigo y par que anota por la noche lo que conversó en la mesa o
  por teléfono con una figura genial a la que admira, quiere y a veces padece.
- Aperturas telegráficas de ritual doméstico: cada entrada abre con una línea mínima y
  seca al modo de «Come en casa.», «Come en casa Apellido.», «Almorzamos en…», «Hablamos
  por teléfono.», «En el vestuario.».
- Sintaxis de apunte taquigráfico y seco: frases breves, exactas, sin adjetivación
  decorativa ni "literatura". PROHIBIDAS las acotaciones de novela mala ("esboza una
  sonrisa", "suspira", "con aire pensativo", "clava la mirada", "hace una pausa") y los
  verbos dicendi teatrales ("murmura", "susurra", "exclama", "sentencia con gravedad",
  "replica con ironía", "confiesa emocionado"). Tampoco expliques nunca el chiste ("lo
  dice con ironía", "en tono de broma", "irónicamente"): la ironía debe surgir sola de la
  frase seca.
- Claridad absoluta de quién habla y formato en MAYÚSCULAS: jamás dejes una cita «…»
  suelta o ambigua en la que el lector dude si habla el rol "Borges" o el diarista "Bioy".
  Cuando introduzcas parlamentos con el formato de libreta con dos puntos, el apellido
  (o YO) va SIEMPRE TODO EN MAYÚSCULAS: «APELLIDO: «Texto». YO: «Texto». APELLIDO: «Texto».».
  Alterná ese formato de libreto en mayúsculas con atribuciones verbales secas e inequívocas
  («Apellido dice: «…»», «Observa que…», «Le digo: «…»»).
- El diarista ("Bioy") jamás es un secretario pasivo ni obsecuente: discute, propone
  teorías que el otro demuele en cinco palabras, trae chismes de terceros, defiende a
  un colega mediocre por tibieza y anota sin indulgencia sus propias torpezas, vanidades
  o concesiones cobardes («Yo, por adulación, le doy la razón», «Defiendo a X sin convicción»).
- Anatomía del juicio del "Borges": nunca habla con frases épicas, de póster motivacional
  ni con solemnidad filosófica. Sus juicios sobre colegas, rivales o figuras del día parten
  de una minucia técnica, física o verbal concreta del oficio (un control de pelota, un
  compás de batería, un corte de montaje, un revés paralelo, una declaración en el diario,
  una vanidad mal disimulada) o del examen pieza por pieza de algo recién visto o escuchado,
  para extraer una clasificación arbitraria, una demolición despiadada o un elogio lateral.
- Vocabulario propio del oficio real de los personajes: lo que se imita es la SINTAXIS, la
  maledicencia de sobremesa y el ritmo del cuaderno, NUNCA los temas escolares de Jorge Luis
  Borges (prohibido meter "laberintos", "espejos", "tigres" o "el infinito" si los
  protagonistas son futbolistas, músicos, cineastas, empresarios o políticos).
- Cierres en punta y anticlímax: las entradas nunca cierran con una moraleja ni con una
  reflexión poética; cortan en seco con una réplica breve, un dato doméstico o físico (el
  menú, un plato que cayó pesado, una dolencia menor, alguien que se retira temprano, un
  pronóstico desmentido al día siguiente) o una contradicción flagrante.
- Castellano rioplatense natural y culto, con voseo en el diálogo cuando corresponde.
`.trim();

/** Reglas de originalidad y seguridad que van en todos los system prompts de escritura. */
const REGLAS_ORIGINALIDAD = `
Reglas de originalidad (obligatorias):
- Escribí texto 100% ORIGINAL. No reproduzcas, parafrasees de cerca ni cites pasajes
  reales del libro "Borges" de Adolfo Bioy Casares ni de ninguna otra obra protegida.
- No cites obras con derechos de autor más allá de un título o de alguna palabra suelta.
- Todo el diálogo es ficticio: no lo presentes como declaraciones reales de nadie.
- No describas ni imites logos, escudos o marcas registradas.
- Nada de difamación grave: las críticas pueden ser ácidas y graciosas, pero sobre la
  obra, el estilo o la conducta pública; nada de acusar de delitos, enfermedades o
  hechos privados inventados. Nada de contenido sexual ni de odio.
`.trim();

const SALIDA_JSON = `Respondé ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después y sin bloques de código.`;

function lista(xs: string[]): string {
  return xs.length ? xs.join(", ") : "(sin indicar)";
}

/* ------------------------------------------------------------------ */
/* 1. Identificación de personas y relación                            */
/* ------------------------------------------------------------------ */

export function promptValidacion(p: Parametros): { system: string; user: string } {
  const system = `
Sos un documentalista literario e histórico. Tu tarea es identificar a las dos figuras
pedidas y describir su vínculo real documentado (o, si el cruce o la fecha son
inverosímiles o ucrónicos, anotar la ucronía en "justificacion" pero ACEPTAR IGUAL el
pedido con "aceptado": true para que el diario apócrifo se escriba de todos modos).
Usá la búsqueda web si la tenés disponible.

Criterios:
- Poné siempre "aceptado": true (salvo que se trate de menores de edad). Si las dos
  personas no se conocieron en la realidad o pertenecen a épocas distintas, explicá ese
  carácter imaginario/ucrónico en "justificacion" y proponé en "relacion" cómo sería el
  trato entre ambos dentro de la ficción.
- Indicá fechas de nacimiento y muerte (si murió) con la precisión que encuentres
  ("AAAA-MM-DD", "AAAA-MM" o "AAAA"), y desde cuándo se conocen (o null si es ucronía).
- "apodos": SOLO apodos ampliamente documentados (prensa, biografías). Ante la duda,
  lista vacía.
- "apellido": cómo se lo nombra por el apellido ("Messi", "Bioy Casares", "García", "De Niro").

${SALIDA_JSON}
Formato:
{
  "aceptado": true,
  "justificacion": "2-3 oraciones en castellano sobre el vínculo real o la ucronía planteada",
  "relacion": "descripción breve de la relación documentada o imaginada",
  "inicioRelacion": "AAAA[-MM[-DD]]" | null,
  "inicioAproximado": boolean,
  "ambito": "literatura | fútbol | música | cine | política | tecnología | tenis | ...",
  "borges": { "nombre": string, "conocido": true, "descripcion": string, "nacimiento": string|null, "muerte": string|null, "apodos": string[], "apellido": string },
  "bioy":   { "nombre": string, "conocido": true, "descripcion": string, "nacimiento": string|null, "muerte": string|null, "apodos": string[], "apellido": string },
  "noVerificados": string[],
  "fuentes": [{ "titulo": string, "url": string }]
}`.trim();

  const user = `
Pedido:
- Persona A (rol "Borges"): ${p.borges}
- Persona B (rol "Bioy", el diarista): ${p.bioy}
- Criticados: ${lista(p.criticados)}
- Alabados: ${lista(p.alabados)}
- Presentes: ${lista(p.presentes)}
- Fecha pedida para la entrada: ${p.fecha}`.trim();

  return { system, user };
}

/* ------------------------------------------------------------------ */
/* 2. Contexto histórico de la fecha                                   */
/* ------------------------------------------------------------------ */

export interface Ventana {
  /** Fecha de la primera entrada. */
  desde: string;
  /** Última fecha posible para la última entrada. */
  hasta: string;
  /** Cantidad de entradas de la página. */
  n: number;
}

export function promptContexto(p: Parametros, v: Validacion, w: Ventana): { system: string; user: string } {
  const system = `
Sos un documentalista. Reunís el contexto histórico REAL del período ${w.desde} → ${w.hasta}
para que un escritor pueda ambientar ${w.n} entradas de diario que empiezan el ${w.desde}.
Si los personajes o la fecha plantean una ucronía o un cruce imaginario, reuní igual los
hechos reales de esa fecha y del oficio de cada uno para que el diario tenga textura
histórica concreta.

Buscá, según el ámbito, en las 2-3 semanas previas a ${w.desde} y en TODO el período
${w.desde} → ${w.hasta}:
- Fútbol/deporte: partidos con RESULTADOS exactos, próximos partidos/torneos,
  lesiones, convocatorias, polémicas, títulos.
- Literatura/cine/música/teatro: libros, estrenos, discos, grabaciones, giras, premios,
  viajes, peleas públicas.
- Política/tecnología/empresas: elecciones, lanzamientos, directorios, cargos, crisis, viajes.
Elegí ${w.n} fechas para las entradas ("fechasSugeridas"): la primera es ${w.desde}; las
otras, días después (nunca después de ${w.hasta}), en orden.
Sugerí además una escena para la primera fecha y 1-3 figuras públicas plausibles de
criticar y de alabar (reales, conocidas, del mismo mundo).

${SALIDA_JSON}
Formato:
{
  "resumen": "4-8 oraciones sobre todo el período",
  "recientes": [{ "fecha": "AAAA-MM-DD", "descripcion": string }],
  "proximos": [{ "fecha": "AAAA-MM-DD", "descripcion": string }],
  "fechasSugeridas": ["AAAA-MM-DD", ...],
  "escenaSugerida": string,
  "criticadosSugeridos": string[],
  "alabadosSugeridos": string[],
  "fuentes": [{ "titulo": string, "url": string }]
}`.trim();

  const user = `
Personas: ${v.borges.nombre} (${v.borges.descripcion ?? ""}) y ${v.bioy.nombre} (${v.bioy.descripcion ?? ""}).
Relación: ${v.relacion}
Ámbito: ${v.ambito}
Período: ${encabezadoDeEntrada(w.desde)} ${fechaLarga(w.desde)} → ${fechaLarga(w.hasta)}.
Cantidad de entradas: ${w.n}
Escena pedida para la primera entrada: ${p.escena ?? "(elegir una verosímil)"}
Tema pedido: ${p.tema ?? "(libre)"}`.trim();

  return { system, user };
}

/* ------------------------------------------------------------------ */
/* 3. Escritura de la entrada                                          */
/* ------------------------------------------------------------------ */

function principioVoz(v: Validacion): string {
  return `
PRINCIPIO DE VOZ (el más importante):
${v.bioy.nombre}, el diarista, es un ÍNTIMO de ${v.borges.nombre}: comparte su mesa,
sus sobremesas, sus viajes, llamadas, pequeñas manías, humores y chismes del gremio.
Conoce esa cotidianidad y la anota con la sequedad exacta del libro "Borges" de Bioy
Casares: observación maliciosa, detalles técnicos del oficio, demoliciones al pasar de
colegas o rivales, y las propias vacilaciones o vanidades del diarista. Nunca relleno
genérico ni tono de biografía escolar.`.trim();
}

function reglasTrato(v: Validacion): string {
  const B = v.borges.nombre;
  const Y = v.bioy.nombre;
  const apB = apellidoDe(v.borges);
  const apBUpper = apB.toUpperCase();
  const apYUpper = apellidoDe(v.bioy).toUpperCase();
  const ap = (x: Validacion["borges"]) => (x.apodos?.length ? x.apodos.join(", ") : "ninguno");
  return `
TRATO, NOMBRES Y ATRIBUCIÓN DE CITAS (obligatorio, se revisa cita por cita):
- Formato de citas con apellido en MAYÚSCULAS: cuando uses el formato de libreto con dos
  puntos antes de una cita, escribí SIEMPRE el apellido todo en mayúsculas:
  «${apBUpper}: «Texto».» y para el diarista «${apYUpper}: «Texto».» (o «YO: «Texto».»).
- CERO CITAS AMBIGUAS: en cada cita entre «» debe quedar 100% claro e inequívoco si
  está hablando ${B} o ${Y}. Está PROHIBIDO empezar una oración directamente con «Texto»
  sin anteponer «${apBUpper}: » o «${apYUpper}: » (o «YO: »), sobre todo después de una
  oración en la que hablaba o actuaba el otro.
- Sin vocativos entre ellos: ${B} y ${Y} NUNCA se llaman por el nombre, el apellido ni un
  apodo dentro del diálogo. Nada de «Gringo, …», «…, Leo», «Mirá, Scaloni». Se dicen las
  cosas directamente, como dos íntimos: «Ponelo a Di María.»
- En la narración (fuera de los encabezados en mayúsculas), el diarista nombra a ${B}
  SIEMPRE por el apellido: «${apB}». Nunca por el nombre de pila, un diminutivo ni un
  apodo. A los terceros, con el nombre natural y documentado.
- No inventes apodos para nadie. Apodos documentados (solo para terceros o referencias
  externas, jamás como vocativo entre ${B} y ${Y}): ${B}: ${ap(v.borges)}; ${Y}: ${ap(v.bioy)}.`.trim();
}

function reglasPagina(v: Validacion, reparto: number[], min: number, max: number): string {
  const np = reparto.length;
  const apBUpper = apellidoDe(v.borges).toUpperCase();
  const apYUpper = apellidoDe(v.bioy).toUpperCase();
  const forma =
    np > 1
      ? `- Son ${np} PÁGINAS impresas enfrentadas (un libro abierto). La página 1 tiene
  ${reparto[0]} entradas y la página 2, ${reparto[1]}; cada página tiene ${min}-${max} palabras.
  La página 2 continúa cronológicamente la 1 (fechas posteriores, la misma voz) sin
  repetir situaciones, escenarios, chistes, fórmulas ni comienzos de oración.`
      : `- Es UNA página impresa con ${reparto[0]} entradas breves, en total ${min}-${max} palabras.`;
  return `
Forma (obligatoria):
${forma}
- Extensión: apuntá a unas ${Math.round((min + max) / 2)} palabras por página y NUNCA más de ${max}
  (contalas antes de responder). Las entradas varían de largo: alguna puede tener 2-4
  renglones secos; otras desarrollan un intercambio de varias réplicas; párrafos cortos.
- Especificidad absoluta: CADA frase y cada anécdota debe pertenecer exclusivamente al
  universo de ${v.borges.nombre} y ${v.bioy.nombre}. Prohibidas las anécdotas comodín
  (paraguas ajenos, horóscopos, cafés genéricos) que servirían para cualquiera.
- Nada de monólogos: ninguna cita de un personaje supera DOS oraciones. Preferí el ida y
  vuelta rápido en formato «${apBUpper}: «…» ${apYUpper}: «…» ${apBUpper}: «…»».
  Citas siempre entre comillas latinas «así».
- Nada de acotaciones novelescas ("esboza una sonrisa", "con aire pensativo", "suspira",
  "clava la mirada"). Usá encabezados en mayúsculas («${apBUpper}: «…»», «${apYUpper}: «…»»)
  o atribuciones secas («${apellidoDe(v.borges)} dice: «…»», «Observa que»).
- Variedad retórica: no repitas fórmulas ("Creen que…", "Esa gente…", "Es incapaz
  de…", "El problema es que…"). Variá los comienzos de oración y el tipo de entrada.
- Cada entrada abre con una línea de situación breve y seca al modo del libro original
  ("Come en casa ${apellidoDe(v.borges)}.", "En el vestuario.", "Hablamos por teléfono."); no repitas palabras
  entre esas líneas ni entre la situación y la primera oración.

${reglasTrato(v)}`.trim();
}

const FORMATO_SALIDA = `{ "dias": [{ "fecha": "AAAA-MM-DD", "situacion": string, "parrafos": string[] }],
  "notas": string[], "escena": string, "criticados": string[], "alabados": string[] }`;

function fechasPorPagina(fechas: string[], reparto: number[]): string {
  return partir(fechas, reparto)
    .map(
      (fs, i) =>
        `${reparto.length > 1 ? `Página ${i + 1}: ` : ""}${fs
          .map((f) => `${f} (${encabezadoDeEntrada(f)})`)
          .join("; ")}`,
    )
    .join("\n");
}

export function promptEntrada(
  p: Parametros,
  v: Validacion,
  c: Contexto,
  fechas: string[],
  reparto: number[] = [fechas.length],
): { system: string; user: string } {
  const [min, max] = PALABRAS_POR_EXTENSION[p.extension];
  const criticados = p.criticados.length ? p.criticados : c.criticadosSugeridos;
  const alabados = p.alabados.length ? p.alabados : c.alabadosSugeridos;
  const apB = apellidoDe(v.borges);
  const apBUpper = apB.toUpperCase();
  const apYUpper = apellidoDe(v.bioy).toUpperCase();
  const escena = p.escena ?? c.escenaSugerida ?? `Come en casa ${apB}`;
  const n = fechas.length;
  const np = reparto.length;

  const system = `
Sos un escritor de pastiches literarios. Escribís ${np > 1 ? `${np} PÁGINAS SEGUIDAS` : "UNA PÁGINA"} de un diario ficticio con
${n} entradas fechadas y consecutivas, en primera persona, cuyo autor es ${v.bioy.nombre}
(en el papel del diarista) y cuyo interlocutor principal es ${v.borges.nombre} (en el
papel del amigo genial). Es una parodia/homenaje fiel al tono, la sequedad y la malicia
conversacional del libro "Borges" de Adolfo Bioy Casares.

${principioVoz(v)}

${ESTILO}

${reglasPagina(v, reparto, min, max)}

Formato del texto:
- "dias": exactamente ${n} objetos, en el orden de las fechas dadas${np > 1 ? " (primero los de la página 1, después los de la página 2, en una sola lista)" : ""}, cada uno con
  "fecha" (la dada), "situacion" (UNA línea breve y seca adaptada a ese día, p. ej. «Come en casa ${apB}.») y "parrafos" (1-3 párrafos cortos).
- "notas": 0-2 notas al pie muy breves y secas de un "editor" aclarando una referencia real mencionada en el texto. Si incluís notas al pie, poné SIEMPRE la llamada con superíndice («¹» para la primera nota, «²» para la segunda) dentro del párrafo exacto donde aparece esa referencia, para que el lector sepa de dónde viene cada nota.
- NO escribas las fechas dentro del texto: los encabezados se agregan aparte.

${REGLAS_ORIGINALIDAD}

Antes de responder, revisá tu borrador y corregilo: (1) ninguna cita de más de dos
oraciones; (2) cada cita tiene interlocutor inequívoco y los encabezados con dos puntos
van en MAYÚSCULAS («${apBUpper}: «…»», «${apYUpper}: «…»»); (3) cero acotaciones novelescas y
cero clichés de laberintos/espejos ajenos al personaje; (4) las líneas de situación no
repiten palabras; (5) ningún vocativo entre ${v.borges.nombre} y ${v.bioy.nombre} en las
citas y ${apB} siempre por el apellido en la narración; (6) cada página entra en ${min}-${max} palabras.

${SALIDA_JSON}
Formato:
${FORMATO_SALIDA}`.trim();

  const hechos = (xs: { fecha: string; descripcion: string }[]) =>
    xs.length ? xs.map((h) => `  - ${h.fecha}: ${h.descripcion}`).join("\n") : "  (ninguno)";

  const user = `
Diarista ("Bioy"): ${v.bioy.nombre} (en etiquetas de diálogo: «${apYUpper}:»)
Amigo ("Borges"): ${v.borges.nombre} (en la narración: «${apB}»; en etiquetas de diálogo: «${apBUpper}:»)
Relación: ${v.relacion}
Fechas de las entradas:
${fechasPorPagina(fechas, reparto)}
Escena de la primera entrada: ${escena}
Presentes: ${lista(p.presentes)}
Tema o disparador: ${p.tema ?? "(libre, a partir del contexto)"}
Tono: ${p.tono ?? "irónico, seco, maledicente y cómplice, al modo del libro Borges"}
Criticados (en algunas entradas, no en todas): ${lista(criticados)}
Alabados (en algunas entradas, no en todas): ${lista(alabados)}

CONTEXTO HISTÓRICO DEL PERÍODO ${c.desde} → ${c.hasta}:
Resumen: ${c.resumen}
Hechos anteriores:
${hechos(c.recientes)}
Hechos del período y próximos:
${hechos(c.proximos)}`.trim();

  return { system, user };
}

/* ------------------------------------------------------------------ */
/* 3b. Revisión (segunda pasada)                                       */
/* ------------------------------------------------------------------ */

export function promptRevision(
  p: Parametros,
  v: Validacion,
  borrador: unknown,
  problemas: string[],
  reparto: number[],
  c?: Pick<Contexto, "resumen" | "recientes" | "proximos">,
): { system: string; user: string } {
  const [min, max] = PALABRAS_POR_EXTENSION[p.extension];
  const n = reparto.reduce((a, b) => a + b, 0);
  const B = v.borges.nombre;
  const Y = v.bioy.nombre;
  const apB = apellidoDe(v.borges);
  const apBUpper = apB.toUpperCase();
  const apYUpper = apellidoDe(v.bioy).toUpperCase();
  const system = `
Sos un corrector de estilo implacable especializado en el diario "Borges" de Adolfo Bioy
Casares. Recibís ${reparto.length > 1 ? `${reparto.length} páginas seguidas` : "una página"} de diario ficticio en JSON y una
lista de problemas detectados automáticamente. Devolvés el MISMO texto corregido:
mismas fechas, mismos hechos, mismo tono y la misma cantidad de entradas (${n}, en el
mismo orden${reparto.length > 1 ? `; las primeras ${reparto[0]} son la página 1` : ""}).
Corregí todos los problemas listados y además revisá por tu cuenta:

${principioVoz(v)}

${reglasPagina(v, reparto, min, max)}

CHEQUEO ACTIVO DE ATRIBUCIÓN, MAYÚSCULAS Y SEQUEDAD (hacelo cita por cita):
1. Revisá cada cita entre «»: si no queda 100% claro quién habla, antepone «${apBUpper}: »
   o «${apYUpper}: » (siempre TODO EN MAYÚSCULAS antes de los dos puntos).
2. Buscá en cada cita entre «» cualquier vocativo entre ${B} y ${Y}: nombre, apellido,
   apodo o diminutivo usado para dirigirse al otro. Eliminalo y dejá la frase dicha directamente.
3. Buscá en la narración cada mención de ${B}: si aparece por el nombre de pila, un
   diminutivo o un apodo, cambialo por «${apB}».
4. Eliminá cualquier acotación novelesca y dejá el tono seco, malicioso y conversacional
   del libro original de Bioy Casares.

${REGLAS_ORIGINALIDAD}

${SALIDA_JSON}
Formato (idéntico al recibido):
${FORMATO_SALIDA}`.trim();

  const hechos = c
    ? [...c.recientes, ...c.proximos].map((h) => `  - ${h.fecha}: ${h.descripcion}`).join("\n")
    : "";
  const user = `
Problemas detectados automáticamente:
${problemas.length ? problemas.map((x) => `- ${x}`).join("\n") : "- (ninguno; pulí igual la atribución en MAYÚSCULAS «" + apBUpper + ": «…»» / «" + apYUpper + ": «…»», la sequedad de cuaderno y el filo de las réplicas)"}
${c ? `\nContexto del período:\n${c.resumen}\n${hechos}\n` : ""}
Texto a corregir:
${JSON.stringify(borrador)}`.trim();

  return { system, user };
}

/* ------------------------------------------------------------------ */
/* 4. Imagen (opcional; por defecto IMAGE_PROVIDER=none)               */
/* ------------------------------------------------------------------ */

export function promptPagina(titulo: string, e: Pick<Entrada, "dias">): string {
  const primera = e.dias[0];
  const extracto = e.dias
    .map((d) => `${d.encabezado} ${d.situacion} ${d.parrafos.join(" ")}`)
    .join(" ")
    .slice(0, 600);
  return `
Photorealistic close-up photograph of an open hardcover book lying on a wooden table,
warm reading-lamp light, slight page curvature at the gutter, cream laid paper,
visible paper grain, letterpress-like black serif typesetting (Garamond-style),
generous margins, running head "${titulo}" at the top of the page and a page number.

The page shows ${e.dias.length} short dated diary entries, starting with a
small bold year "${primera.anio}"; each entry begins with an italic date line (the first
is "${primera.encabezado}") followed by body text. Render the beginning of this text as
faithfully as possible (it may continue beyond the visible area):
"${extracto}"

No real logos, no brand marks, no photos of people on the page.
In a lower corner of the photo, small but legible sans-serif text: "${MARCA_PARODIA}".
`.trim();
}
