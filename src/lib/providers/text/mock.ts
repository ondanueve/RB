/**
 * Proveedor de texto para las parejas de ejemplo y respaldo sin red.
 *
 * - Cada pareja de PAREJAS_DEMO cuenta con su propio diario completo de 6 entradas
 *   (dos páginas enfrentadas), escrito a medida al estilo del libro "Borges" de Adolfo
 *   Bioy Casares, con encabezados de diálogo en MAYÚSCULAS («APELLIDO: «Texto».») y
 *   atribución inequívoca en cada cita.
 * - Si se consulta una pareja o fecha fuera de los ejemplos sin proveedor de IA activo,
 *   procede igual sin rechazar el pedido.
 */
import type { TextProvider, TextRequest, TextResponse } from "../types";
import type { Contexto, Validacion } from "../../types";
import type { Parametros } from "../../schema";
import { sumarDias } from "../../dates";
import { PAREJAS_DEMO, type ParejaDemo } from "../../demo";
import { apellidoDe } from "../../paginas";

export { PAREJAS_DEMO };
export type { ParejaDemo };

export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function buscarPareja(a: string, b: string): { par: ParejaDemo; invertido: boolean } | null {
  const na = normalizar(a);
  const nb = normalizar(b);
  for (const par of PAREJAS_DEMO) {
    const ab =
      par.borges.alias.map(normalizar).includes(na) &&
      par.bioy.alias.map(normalizar).includes(nb);
    const ba =
      par.borges.alias.map(normalizar).includes(nb) &&
      par.bioy.alias.map(normalizar).includes(na);
    if (ab) return { par, invertido: false };
    if (ba) return { par: { ...par, borges: par.bioy, bioy: par.borges }, invertido: true };
  }
  return null;
}

export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function situacionPara(escena: string): string {
  const e = normalizar(escena);
  if (e.includes("concentracion")) return "Cena en la concentración.";
  if (e.includes("vestuario")) return "En el vestuario, después del partido.";
  if (e.includes("conferencia")) return "Conferencia de prensa; después, a solas.";
  if (e.includes("practica") || e.includes("entrenamiento")) return "Práctica de la mañana.";
  if (e.includes("telef") || e.includes("llamada")) return "Llama por teléfono, tarde.";
  if (e.includes("cena") && e.includes("torneo")) return "Cena de jugadores del torneo.";
  if (e.includes("viaje") || e.includes("avion") || e.includes("tren") || e.includes("micro")) return "En viaje.";
  if (e.includes("rodaje")) return "En el rodaje, entre toma y toma.";
  if (e.includes("ensayo")) return "Ensayo.";
  if (e.includes("camarin")) return "En el camarín, antes de salir.";
  if (e.includes("estudio") || e.includes("grabacion")) return "En el estudio, de madrugada.";
  if (e.includes("caminata") || e.includes("camin")) return "Caminamos por el barrio, de noche.";
  if (e.includes("restaurante") || e.includes("almuerzo")) return "Almorzamos en un restaurante.";
  if (e.includes("congreso") || e.includes("festival")) return "Sobremesa en el congreso.";
  if (e.includes("cena") || e.includes("casa")) return "Come en casa.";
  return `${escena.replace(/\.$/, "")}.`;
}

interface DiarioPreescrito {
  resumen: string;
  recientes: { fecha: string; descripcion: string }[];
  proximos: { fecha: string; descripcion: string }[];
  saltosDias: number[];
  criticados: string[];
  alabados: string[];
  notas: string[];
  dias: { situacion: string; parrafos: string[] }[];
}

/**
 * Diarios íntegros y exclusivos, uno por cada pareja de PAREJAS_DEMO.
 * Marcadores:
 *   {B}  = Apellido del rol "Borges" en narración ("Borges", "Messi", "Milei")
 *   {BU} = Apellido del rol "Borges" en MAYÚSCULAS para parlamentos ("BORGES", "MESSI")
 *   {YU} = Apellido del rol "Bioy" en MAYÚSCULAS para parlamentos ("BIOY", "SCALONI")
 */
const DIARIOS_POR_ID: Record<string, DiarioPreescrito> = {
  "borges-bioy": {
    resumen:
      "Junio de 1968 en Buenos Aires. Jorge Luis Borges y Adolfo Bioy Casares cenan casi todas las noches en el departamento de la calle Posadas, corrigen borradores, revisan antologías y comentan con malicia el ambiente literario porteño.",
    recientes: [
      { fecha: "1968-05-30", descripcion: "Conferencia de Borges sobre poesía anglosajona en el Instituto Cultural." },
    ],
    proximos: [
      { fecha: "1968-06-25", descripcion: "Entrega de pruebas de imprenta de una nueva edición en Emecé." },
    ],
    saltosDias: [0, 1, 3, 5, 8, 11],
    criticados: ["Ernesto Sabato", "Eduardo Mallea"],
    alabados: ["Robert Louis Stevenson", "Alfonso Reyes"],
    notas: [
      "Eduardo Mallea había publicado el año anterior La barca de hielo (Buenos Aires, Sudamericana, 1967).",
      "H. Bustos Domecq, seudónimo conjunto de Borges y Bioy Casares; en 1967 habían dado a conocer Crónicas de Bustos Domecq.",
    ],
    dias: [
      {
        situacion: "Come en casa {B}.",
        parrafos: [
          "Trae del brazo un volumen desencuadernado de una enciclopedia escocesa y se niega a dejarlo en el vestíbulo. Durante la sopa comentamos el último suplemento literario del domingo y una novela extensa de Mallea¹; {B} toma una cucharada mínima. {BU}: «Ha descubierto el arte de escribir trescientas páginas sin que ocurra un solo sustantivo concreto. Uno lee dos capítulos y siente que está esperando el tren en una estación de provincia».",
          "{YU}: «En el jurado municipal dicen que este año le toca el primer premio por antigüedad». {BU}: «Los premios municipales existen para consolar a quienes confunden la gravedad con el estilo. Si un libro pesa más de medio kilo, los académicos suponen que contiene ideas». Pide medio vaso de leche fría y repite el postre.",
        ],
      },
      {
        situacion: "Caminamos por la avenida Quintana.",
        parrafos: [
          "Frío húmedo de invierno entre los árboles de la Recoleta. Un joven desconocido nos detiene en la esquina para pedirle opinión sobre una tragedia en verso dedicada a los caudillos federales; {B} le estrecha la mano con excesiva cortesía. {BU}: «Le aconsejo suprimir los primeros cuatro actos para ganar misterio. Si además suprime el quinto, el lector le agradecerá la discreción».",
          "Apenas el muchacho cruza la calle, le reprocho tanta crueldad con un principiante. {BU}: «Más cruel sería alentarlo a publicar. Ahora por lo menos nos odiará con energía, que es una pasión mucho más higiénica que el endecasílabo patriótico». Al llegar a la puerta tropieza con el escalón de mármol y se ríe de su propia torpeza.",
        ],
      },
      {
        situacion: "Hablamos por teléfono, tarde.",
        parrafos: [
          "Me llama desde la Biblioteca Nacional porque alguien dejó sobre su escritorio un artículo de Sabato acerca de la angustia metafísica del escritor rioplatense. {BU}: «Cree que sufrir en público es una obligación gremial. Escribe cada frase como si estuviera posando de perfil para una estatua ecuestre en Chivilcoy».",
          "{YU}: «La semana pasada declaró en una revista que la literatura humorística es un género menor». {BU}: «Llama menores a los géneros que no dependen del ceño fruncido. Stevenson le parecería frívolo porque tenía la mala costumbre de entretener al lector en la primera página». Quedamos en vernos a las nueve para corregir dos páginas.",
        ],
      },
      {
        situacion: "Sobremesa del martes.",
        parrafos: [
          "Revisamos un soneto de un poeta español contemporáneo muy elogiado en Madrid; leemos el primer cuarteto en voz alta. {YU}: «El segundo verso tiene cierta música verbal». {BU}: «Tiene el ruido de una mudanza por la escalera. Usa palabras prestigiosas como quien alquila un frac demasiado grande para ir al cinematógrafo».",
          "Probamos cambiar dos adjetivos por otros más llanos y el poema desaparece por completo. {BU}: «Ahí está la prueba: cuando le quitás la bisutería, abajo no había ni siquiera una equivocación interesante. Alfonso Reyes con tres palabras comunes te dejaba una cortesía inolvidable». Anoto que a las once me dolía el estómago por el dulce de membrillo.",
        ],
      },
      {
        situacion: "En la librería de la calle Florida.",
        parrafos: [
          "Pasamos a buscar una edición inglesa de De Quincey y encontramos en la vidriera una faja colorada que anuncia «la novela definitiva de nuestra generación». {B} se acerca el cartel a dos centímetros del ojo sano. {BU}: «Cada seis meses aparece la obra definitiva de una generación que todavía no aprendió a usar el punto y coma. La posteridad suele ser bastante más distraída que las editoriales».",
          "{YU}: «El autor nos mandó el libro dedicado el mes pasado con tres adjetivos entusiastas». {BU}: «Conté cuatro en el sobre. Cuando una dedicatoria pasa de dos líneas, ya es un intento de soborno o una amenaza». Salimos rápido por temor a cruzarnos con el novelista en la vereda.",
        ],
      },
      {
        situacion: "Cena del viernes.",
        parrafos: [
          "Trabajamos dos horas en un cuento policial de Bustos Domecq²; pasamos cuarenta minutos discutiendo el apellido de un escribano de Lomas de Zamora. {YU}: «Si le ponemos un apellido demasiado raro, el lector sospecha del personaje antes del crimen». {BU}: «El lector ya sospecha de nosotros desde la tapa. Pongámosle un apellido gris de guía telefónica, que es donde se esconden los verdaderos monstruos».",
          "Antes de irse recuerda una frase que leyó por la mañana en el diccionario de la Academia. {BU}: «Los gramáticos españoles creen que el idioma es un museo de cera vigilado por gendarmes. Uno abre una página al azar y huele a naftalina de sacristía». Baja en el ascensor recitando de memoria cuatro versos de Browning.",
        ],
      },
    ],
  },

  "messi-scaloni": {
    resumen:
      "Diciembre de 2022 en Doha y Ezeiza. Tras eliminar a Croacia (3-0) en semifinales del Mundial de Qatar, la selección argentina prepara la final del 18 de diciembre contra Francia en el estadio Lusail y regresa luego a Buenos Aires.",
    recientes: [
      { fecha: "2022-12-09", descripcion: "Argentina supera a Países Bajos por penales tras empatar 2-2 en cuartos de final." },
      { fecha: "2022-12-13", descripcion: "Victoria 3-0 ante Croacia en semifinales con goles de Messi y Julián Álvarez." },
    ],
    proximos: [
      { fecha: "2022-12-18", descripcion: "Final de la Copa del Mundo ante Francia en el estadio Lusail (3-3 y triunfo por penales)." },
      { fecha: "2022-12-20", descripcion: "Caravana de recepción en Buenos Aires con millones de personas en las autopistas." },
    ],
    saltosDias: [0, 1, 2, 3, 5, 7],
    criticados: ["Louis van Gaal", "Kylian Mbappé"],
    alabados: ["Ángel Di María", "Pablo Aimar"],
    notas: [
      "El predio de la Universidad de Qatar funcionó como concentración argentina durante todo el Mundial de 2022.",
      "Alusión a las declaraciones de Kylian Mbappé en mayo de 2022 sobre el nivel de las eliminatorias sudamericanas.",
    ],
    dias: [
      {
        situacion: "Cena en la concentración.",
        parrafos: [
          "Come en nuestra mesa del pabellón universitario¹. Repasamos en una tableta el retroceso de los volantes franceses; llevo veinte minutos marcando triángulos con el dedo, hasta que {B} mira dos jugadas y apaga la pantalla. {BU}: «El lateral izquierdo de ellos cierra mirando la pelota y nunca la espalda. Si el Fideo recibe abierto dos veces, a la tercera no sale nadie».",
          "Intento defender el pizarrón que preparamos con Aimar. {YU}: «Igual conviene cubrir la subida de Theo Hernández con un volante más». {BU}: «Que se preocupe él por cubrir la nuestra. Cuando empezás a contar los pasos ajenos, llegás tarde al tuyo». Se sirve otro pedazo de vacío, revisa mi termo y se lo lleva a la pieza sin pedir permiso.",
        ],
      },
      {
        situacion: "Práctica vespertina en Doha.",
        parrafos: [
          "Calor seco sobre el césped. En el banco alguien recuerda aquellas frases de Mbappé sobre el fútbol sudamericano²; {B} se ata los cordones despacio. {BU}: «Habla del continente como quien opina de un barrio al que nunca entró. En La Paz, a los veinte minutos, pedís cambio de pulmón».",
          "{YU}: «En velocidad pura igual te liquida en tres zancadas». {BU}: «En tres zancadas sí; en noventa minutos hay que saber caminar». Termina la frase, patea al arco vacío desde treinta metros y deja la pelota muerta contra el caño derecho.",
        ],
      },
      {
        situacion: "En el vestuario, de noche.",
        parrafos: [
          "Bulla de bombos, vendas sucias en el piso y olor a linimento mezclado con champán. {B} está sentado en un cajón de utilería, descalzo, mirando las medias mojadas. {BU}: «Cuando metieron el segundo pensé que había que jugar todo el torneo de nuevo. Menos mal que el Dibu tiene los brazos más largos que el reglamento».",
          "Confieso que en el suplementario me temblaban las piernas y que grité dos cambios al revés. {BU}: «Nadie te escuchaba igual. A esa hora solo se oye el pasto». Guarda los botines en una bolsa de plástico común y pregunta a qué hora traen las milanesas.",
        ],
      },
      {
        situacion: "Vuelo de regreso, madrugada.",
        parrafos: [
          "Mitad del plantel duerme sobre las frazadas de la aerolínea; el resto desafina en el pasillo. {B} lleva la copa atada con el cinturón en el asiento de al lado. {BU}: «Pesa como un televisor viejo. Si la soltás en un pozo de aire, lastimás a un volante central».",
          "{YU}: «Todavía me dura la bronca por las declaraciones de Van Gaal antes de los cuartos». {BU}: «Perdió por buscar excusas antes del sorteo. Los técnicos altos creen que por mirar desde arriba entienden el pique corto». Baja la persiana de la ventanilla y se duerme antes de cruzar el Atlántico.",
        ],
      },
      {
        situacion: "Micro descubierto por Riccheri.",
        parrafos: [
          "Cinco millones de personas bajo un sol que derrite el asfalto; avanzamos cuatro kilómetros en tres horas. {B} tiene puesto un sombrero piluso blanco y las orejas coloradas. {BU}: «Si tirás una moneda desde acá arriba, no toca el suelo hasta el jueves. Nunca vi tanta gente de acuerdo en algo».",
          "Señalo a un muchacho trepado a un semáforo con una bandera mal pintada que nos junta las caras. {BU}: «Te pusieron el pelo mío de hace diez años. Al menos a vos te ahorraron las canas del alargue». Nos bajan en helicóptero porque el chofer ya no distingue dónde termina la autopista.",
        ],
      },
      {
        situacion: "Hablamos por teléfono, siesta.",
        parrafos: [
          "Ya está en su casa de Rosario; de fondo se oye el chapoteo de una pileta y un perro ladrando lejos. {YU}: «¿Pudiste dormir ocho horas seguidas?». {BU}: «Dormí cuatro y soñé que faltaba patear un penal más. Cuando me desperté busqué las chinelas como si fueran los botines».",
          "{YU}: «Hasta marzo no te hablo de táctica». {BU}: «En marzo me vas a mandar veinte videos por teléfono antes del desayuno. Conozco tu concepto de vacaciones». Corta antes de que alcance a desmentirlo; anoto con vergüenza que ya tenía abierta la carpeta de marzo sobre el escritorio.",
        ],
      },
    ],
  },

  "milei-macri": {
    resumen:
      "Agosto y septiembre de 2024 en la Quinta de Olivos y Buenos Aires. Javier Milei y Mauricio Macri mantienen sus habituales cenas nocturnas de milanesas con ensalada para discutir vetos parlamentarios, cargos pendientes en el Estado, la política monetaria de Luis Caputo y la interna del PRO.",
    recientes: [
      { fecha: "2024-08-01", descripcion: "Relanzamiento formal del partido PRO encabezado por Macri en el barrio de La Boca." },
    ],
    proximos: [
      { fecha: "2024-09-15", descripcion: "Presentación del proyecto de Presupuesto 2025 ante el Congreso de la Nación." },
    ],
    saltosDias: [0, 2, 5, 9, 13, 18],
    criticados: ["Martín Lousteau", "Horacio Rodríguez Larreta"],
    alabados: ["Luis Caputo", "Federico Sturzenegger"],
    notas: [
      "Las veladas en la residencia de Olivos solían extenderse hasta pasada la medianoche con grabaciones de ópera italiana.",
      "Durante 2024 se hicieron frecuentes las cenas privadas en Olivos con menú fijo de milanesas y ensalada.",
    ],
    dias: [
      {
        situacion: "Cena en la Quinta de Olivos.",
        parrafos: [
          "Llego a las nueve y media con una carpeta de candidatos para las secretarías vacantes; {B} me recibe en campera de cuero y pone un acto entero de Verdi¹ a un volumen que hace vibrar las copas de agua. {BU}: «Escuchá cómo entra el coro de los esclavos sin pedir permiso a ninguna comisión. Si los economistas keynesianos supieran medir el compás, no emitirían billetes fuera de tiempo».",
          "Intento abrir la carpeta sobre el plato de ensalada para revisar los nombres de Transporte. {YU}: «Necesitamos cuadros con experiencia de gestión para que funcionen los expedientes». {BU}: «Tu gente confunde gestionar con comprar sillones nuevos para el directorio. Yo prefiero un funcionario que no sepa dónde queda el baño antes que un moderado con PowerPoint». Como la milanesa tibia y guardo la lista en el saco.",
        ],
      },
      {
        situacion: "Hablamos por teléfono, medianoche.",
        parrafos: [
          "Me despierta cuando ya tenía apagada la luz después del partido de bridge. Acaba de leer un hilo de diez mensajes sobre la curva de tasas del Banco Central; {B} habla sin tomar aire durante dos minutos. {BU}: «Los consultores de la City lloran por el tipo de cambio porque extrañan cobrar informes de diez páginas que nadie lee. Son parásitos del redondeo decimal».",
          "{YU}: «Conviene cuidar las formas con la prensa económica para no asustar a los inversores». {BU}: «Los buenos modales nos dejaron con doscientos por ciento de inflación y tres ministerios de género. Cuando alguien te pide consenso en Buenos Aires, te está pidiendo la billetera». Corta a la una y veinte; veo que sigue publicando gráficos hasta las tres.",
        ],
      },
      {
        situacion: "Caminata nocturna por los jardines.",
        parrafos: [
          "Salimos después del café hacia el sector de los caniles con frío de agosto. Alguien menciona a Larreta y sus apariciones recientes en televisión; {B} se detiene junto a un farol de hierro. {BU}: «Se pasó cuatro años midiendo encuestas de baldosas y perdió hasta con el voto en blanco. Cree que la política es una reunión de consorcio en Barrio Parque donde gana el que sirve café descafeinado».",
          "{YU}: «En su momento armó equipos técnicos que conocían cada repartición de memoria». {BU}: «Conocían las reparticiones para agrandarlas. Conocer el Estado por dentro sin querer cerrarlo es como estudiar medicina a favor de la bacteria». Me retiro a las once con dolor de cervicales por el frío húmedo del río.",
        ],
      },
      {
        situacion: "Despacho de la Casa Rosada, tarde.",
        parrafos: [
          "Pasa Caputo con una planilla de vencimientos de deuda y se queda diez minutos parado junto al escritorio. {B} mira la fila de números de superávit como quien contempla un cuadro del Renacimiento. {BU}: «Toto corta los giros discrecionales con la frialdad de un cirujano inglés. Los gobernadores entran pidiendo una autopista y salen agradeciendo que les paguemos el café».",
          "{YU}: «En el Senado varios gobernadores amenazan con votar junto a la oposición esta semana». {BU}: «Que voten lo que quieran: el veto tarda treinta segundos en firmarse y no gasta tinta colorada. Lousteau levanta la mano en el recinto como si estuviera presentando un libro en la Facultad». Pide un té edulcorado y me muestra una miniatura en bronce.",
        ],
      },
      {
        situacion: "Sobremesa del martes.",
        parrafos: [
          "Otra vez milanesa de carne con lechuga²; es la cuarta vez en el mes que comemos exactamente el mismo plato. {YU}: «Podríamos decirle al cocinero que la semana que viene prepare un pescado al horno». {BU}: «Cambiar un menú que funciona es el primer síntoma del socialismo europeo. Si empezás pidiendo merluza los martes, en seis meses estás regulando el precio del limón».",
          "Llega Sturzenegger con una pila de trescientas derogaciones impresas en papel oficio. {BU}: «Federico encuentra un reglamento de mil novecientos treinta sobre carruajes a caballo y se emociona como un chico en juguetería. Es el único hombre del país que lee el Boletín Oficial para divertirse». A la medianoche me vence el sueño en el sillón.",
        ],
      },
      {
        situacion: "Mensajes después del domingo.",
        parrafos: [
          "Vengo de perder dos sets seguidos al pádel y me encuentro con catorce audios suyos comentando un discurso de un premio Nobel norteamericano. Lo llamo desde el auto para no escucharlos uno por uno. {BU}: «A ese profesor le dieron la medalla en Estocolmo por demostrar en pizarrón que el agua moja hacia arriba. En una verdulería de Once se funde antes del mediodía».",
          "{YU}: «No te pelees con las universidades extranjeras que el mes que viene tenés gira en Nueva York». {BU}: «En Nueva York van a escuchar tres horas de teoría del capital austríaco sin intervalo. El que quiera discursos redondos que contrate a un embajador de carrera». Anoto que el jueves que viene llevo mi propia vianda en el asiento trasero.",
        ],
      },
    ],
  },

  "riquelme-delgado": {
    resumen:
      "Mayo de 2024 en el predio de Ezeiza y la Bombonera. Con Juan Román Riquelme ya al frente de la presidencia de Boca Juniors y Marcelo «el Chelo» Delgado como ladero y confidente en el Consejo de Fútbol, las sobremesas de asado y mate se extienden hasta la madrugada entre dardos a Martín Palermo, los programas deportivos y la oposición.",
    recientes: [
      { fecha: "2023-12-17", descripcion: "Riquelme se impone en las elecciones presidenciales de Boca Juniors con récord histórico de votantes." },
    ],
    proximos: [
      { fecha: "2024-05-29", descripcion: "Cierre de la fase de grupos de la Copa Sudamericana en la Bombonera." },
    ],
    saltosDias: [0, 2, 4, 6, 9, 12],
    criticados: ["Martín Palermo", "Mauricio Macri"],
    alabados: ["Carlos Bianchi", "Sergio Romero"],
    notas: [
      "En las elecciones de Boca Juniors de diciembre de 2023, la lista opositora de Andrés Ibarra y Mauricio Macri había anunciado a Martín Palermo como su director técnico.",
      "El 12 de abril de 2010, ante Arsenal en la Bombonera, Riquelme dejó solo a Palermo para su gol 219 (récord histórico del club) y ambos festejaron en mitades opuestas de la cancha.",
    ],
    dias: [
      {
        situacion: "Asado nocturno en el predio de Ezeiza.",
        parrafos: [
          "Una y media de la mañana en el quincho; afuera quedó el humo de la leña flotando sobre las canchas vacías. En el televisor sin volumen repiten un programa donde postulan otra vez a Palermo¹ como futuro técnico del club; {B} cambia la yerba del mate con una cuchara chica sin apurarse. {BU}: «En el año dos mil le teníamos que tirar el centro directo a la frente para que no intentara pararla con la tibia. Ahora se compró un saco ajustado y los periodistas dicen que estudia táctica moderna».",
          "{YU}: «En la semana declaró que con vos no podría convivir porque tienen caracteres distintos». {BU}: «Llama carácter a quedarse parado en el punto del penal esperando que otro gambetee a tres rivales. Cuando uno se acostumbra a empujarla abajo del arco, termina creyendo que la jugada empieza en el área chica». Destapa el termo, prueba el primer mate frío y lo tira en la rejilla del patio.",
        ],
      },
      {
        situacion: "Caminata por las canchas auxiliares, tarde.",
        parrafos: [
          "Miramos el entrenamiento de la sexta división apoyados contra el alambrado. Un delantero centro erra dos pases seguidos de frente y levanta los brazos pidiendo disculpas; {B} se sube el cierre de la campera azul. {BU}: «Me hace acordar a Martín cuando quería salir jugando atrás de la mitad de la cancha y se la entregaba al cuatro contrario. La diferencia es que este chico tiene diecisiete años y todavía puede aprender a perfilarse».",
          "{YU}: «Igual la gente todavía se acuerda de los goles importantes que metió». {BU}: «Del que más me acuerdo es del récord contra Arsenal², cuando lo dejé solo abajo del travesaño y salió corriendo para el córner opuesto así no tenía que dar las gracias. Corrió cuarenta metros por primera vez en el torneo para esquivar el abrazo». Volvemos a la oficina antes de que baje el sol.",
        ],
      },
      {
        situacion: "Oficina de Brandsen, mediodía.",
        parrafos: [
          "Viene el representante de un volante de veinte años con diez partidos en primera a pedir cláusula en dólares y sueldo europeo. {B} lo escucha veinte minutos sin abrir la carpeta y le alcanza un mate lavado. {BU}: «El chico todavía no sabe patear un córner con empeine interno y vos ya le compraste una camioneta importada. Si quiere cobrar en euros, primero tiene que acertarle un pase al compañero que lleva la misma camiseta».",
          "{YU}: «A la tarde va a salir a llorar en todos los canales deportivos del mediodía». {BU}: «Los muchachos de la televisión gritan dos horas por día porque nunca tuvieron que parar la pelota con cincuenta mil personas encima. Si les tirás una de cuero al piso del estudio, piden corte comercial». El representante se va sin firmar y olvida los anteojos sobre la mesa.",
        ],
      },
      {
        situacion: "Palco de la Bombonera, domingo.",
        parrafos: [
          "Ganamos dos a uno sufriendo los últimos diez minutos por no liquidarlo de contraataque. Mientras abajo la gente sigue cantando, {B} acomoda los termos vacíos en fila sobre el mostrador. {BU}: «Mañana la oposición va a decir en los diarios que la cancha está vieja y que había que mudarse a un estadio para turistas sentados. No vinieron ni a votar en diciembre porque tenían torneo de golf en Punta del Este».",
          "{YU}: «Macri volvió a declarar que en el club falta gestión empresarial moderna». {BU}: «Para ellos gestionar es vender al nueve antes de que debute en reserva. No conocen el nombre del tres de la cuarta y quieren explicar cómo se arma un plantel». Bajamos al vestuario por la escalera interna cuando ya se apagaron los reflectores.",
        ],
      },
      {
        situacion: "Hablamos por teléfono, madrugada.",
        parrafos: [
          "Son las dos y cuarenta de la mañana y suena el aparato en la mesa de luz. {B} está despierto mirando la repetición de un partido del campeonato paraguayo donde dirige Palermo. {BU}: «Acabo de verlo parado al lado del banco con una pizarra magnética llena de fichas redondas. Si Bianchi le mostraba tres flechas en el vestuario de Tokio, pensaba que era el mapa para llegar al comedor del hotel».",
          "{YU}: «Dejalo tranquilo que allá por lo menos está lejos de los micrófonos de Buenos Aires». {BU}: «En cuanto gane dos partidos seguidos contra un equipo del interior, sus amigos de la tele van a pedir que le demos las llaves del predio. Menos mal que en Ezeiza el portón cierra del lado de adentro». Corta sin despedirse porque se le enfrió el agua de la pava.",
        ],
      },
      {
        situacion: "Come en casa {B}, en Don Torcuato.",
        parrafos: [
          "Costillar a la leña sobre tabla de madera y ensalada de tomate solo. Recordamos la gira del año dos mil y cómo entrenábamos los envíos de tres dedos; {B} limpia el cuchillo contra la miga del pan. {BU}: «Vos le pegabas con la parte de afuera del botín y la pelota doblaba sola antes del primer palo. Hoy los extremos corren hasta chocar con el cartel de publicidad y tiran el centro a la segunda bandeja».",
          "{YU}: «El Virrey nos hacía repetir veinte veces la misma diagonal los jueves a la tarde». {BU}: «Carlos sabía todo de fútbol pero hablaba cinco minutos por semana para no aburrir al jugador. Los técnicos nuevos dan charlas de una hora con pantalla gigante porque tienen miedo de que se note que no jugaron nunca». Me llevo dos tiras de carne envueltas en papel aluminio para el almuerzo de mañana.",
        ],
      },
    ],
  },

  "garcia-paez": {
    resumen:
      "Septiembre y octubre de 1986 entre Buenos Aires y Río de Janeiro. Charly García y Fito Páez mezclan y presentan el álbum conjunto «La, la, la», mientras preparan las funciones del estadio Obras Sanitarias.",
    recientes: [
      { fecha: "1986-08-15", descripcion: "Sesiones de grabación en los estudios Panda de Buenos Aires." },
      { fecha: "1986-09-10", descripcion: "Viaje a Río de Janeiro para fotografiar la portada y terminar mezclas." },
    ],
    proximos: [
      { fecha: "1986-10-15", descripcion: "Lanzamiento comercial del disco doble «La, la, la»." },
      { fecha: "1986-10-31", descripcion: "Serie de conciertos conjuntos en el estadio Obras Sanitarias." },
    ],
    saltosDias: [0, 2, 5, 8, 12, 16],
    criticados: ["un ejecutivo de discográfica", "Billy Bond"],
    alabados: ["Luis Alberto Spinetta", "Mercedes Sosa"],
    notas: [
      "«La, la, la» (1986) fue grabado entre los estudios Panda de Buenos Aires y Río de Janeiro.",
      "Luis Alberto Spinetta y García habían trabajado el año anterior en un proyecto conjunto («Cómo conseguir chicas» / «Peluson of Milk») que quedó inconcluso tras el incendio de un departamento.",
    ],
    dias: [
      {
        situacion: "En el estudio, de madrugada.",
        parrafos: [
          "Son las cuatro de la mañana en Panda¹ y el técnico cabecea frente a la consola. Quiero doblar el piano eléctrico con un colchón de cuerdas; {B} borra mi pista de un manotazo sin mirarme. {BU}: «Si ponés tres acordes donde entra uno, parecés un empleado bancario pidiendo aumento. Dejá el hueco para que respire el tambor».",
          "{YU}: «Con las cuerdas la armonía quedaba más vestida». {BU}: «Vestida de casamiento ajeno. A las canciones hay que sacarles la ropa antes de mezclarlas». Pide un whisky tibio en vaso de plástico y deja grabada la voz definitiva en una sola toma.",
        ],
      },
      {
        situacion: "Almorzamos en una pizzería.",
        parrafos: [
          "Comemos fugazzeta de pie junto al mostrador de la avenida Corrientes. Suena en la radio un grupo de moda con baterías electrónicas cuadradas; {B} mastica mirando el techo de chapa. {BU}: «Gastan veinte mil dólares en máquinas japonesas para sonar como una heladera Siam desenchufada. El ritmo es una renguera elegante, no un reloj».",
          "{YU}: «El segundo compás del estribillo no está tan mal armado». {BU}: «Sos demasiado rosarino para ser malo: pedís permiso antes de aburrirte». Deja dos billetes manchados de aceite sobre el mármol y sale caminando sin esperar el vuelto.",
        ],
      },
      {
        situacion: "Hotel de Copacabana, tarde.",
        parrafos: [
          "Persianas bajas y aire acondicionado al máximo mientras afuera hierve la playa. {B} está en bata, afinando una guitarra criolla a la que le falta la cuarta cuerda. {BU}: «El mar visto de cerca es una exageración municipal de los brasileños. Prefiero el ruido de un ascensor viejo en Caballito».",
          "{YU}: «Llamó el gerente de la grabadora para pedir un corte de tres minutos para las radios». {BU}: «Los gerentes escuchan música con la calculadora descompuesta. Si les llevás el himno nacional, te piden que le saques los laureles porque tardan mucho en entrar». Desenchufa el teléfono de la pared y lo esconde debajo de la cama.",
        ],
      },
      {
        situacion: "Sala de ensayo en Palermo.",
        parrafos: [
          "Probamos la lista de temas para Obras durante tres horas seguidas. En un puente meto cuatro compases de más por entusiasmo; {B} frena a toda la banda levantando dos dedos. {BU}: «Cuando te ponés lírico se te cae el tempo al piso. Tocá como si te estuvieran corriendo los acreedores».",
          "Más tarde alguien nombra a Spinetta² y el humor del cuarto cambia de golpe. {BU}: «El Flaco escribe acordes que tienen diez dedos cada uno. Uno los intenta tocar en casa y le sobran nudillos». Es el único colega del país ante el cual baja el volumen del amplificador.",
        ],
      },
      {
        situacion: "Taxi bajo el aguacero.",
        parrafos: [
          "Volvemos apretados en el asiento trasero de un Siam Di Tella con olor a tapizado húmedo. El chofer nos confunde con dos jugadores de Ferro y habla veinte cuadras de un córner mal tirado; {B} le sigue la conversación con seriedad técnica. {BU}: «El problema del wing derecho es que levanta la cabeza cuando ya se le acabó la cal. Es un defecto moral, no deportivo».",
          "Al bajar en Coronel Díaz me comenta en la vereda: {BU}: «Por fin una entrevista sin preguntas sobre la juventud». Entra al edificio pisando los charcos con zapatos de gamuza blanca.",
        ],
      },
      {
        situacion: "Come en casa {B}.",
        parrafos: [
          "Fideos con manteca a la una de la mañana y tres teclados apilados sobre la mesa de planchar. Mercedes Sosa dejó un saludo grabado en el contestador; {B} lo escucha dos veces de pie. {BU}: «La Negra canta una guía telefónica y te hace llorar en la letra M. Nosotros necesitamos veinte cables para afinar una sílaba».",
          "Le muestro una letra nueva que escribí anoche en una servilleta de bar. Tacha la primera estrofa entera con marcador negro y deja las últimas dos líneas. {BU}: «Ahora sí parece tuya. Antes parecía de alguien que quería caerte bien». Me quedo hasta las cinco pasando en limpio lo que sobrevivió al marcador.",
        ],
      },
    ],
  },

  "maradona-coppola": {
    resumen:
      "Diciembre de 2022 entre Doha y Buenos Aires. En las vísperas y los festejos de la final del Mundial de Qatar 2022 ante Francia, Diego Maradona y Guillermo Cóppola viven la consagración de la selección de Lionel Messi y Lionel Scaloni desde una casa en La Perla, el palco del estadio Lusail y la caravana por la autopista Riccheri.",
    recientes: [
      { fecha: "2022-12-13", descripcion: "Argentina vence 3-0 a Croacia en semifinales del Mundial de Qatar." },
    ],
    proximos: [
      { fecha: "2022-12-18", descripcion: "Final del Mundial de Qatar en el estadio Lusail: Argentina 3 (4), Francia 3 (2)." },
      { fecha: "2022-12-20", descripcion: "Caravana histórica de cinco millones de personas en Buenos Aires." },
    ],
    saltosDias: [0, 1, 2, 3, 4, 6],
    criticados: ["Gianni Infantino", "Kylian Mbappé"],
    alabados: ["Lionel Messi", "Emiliano Martínez"],
    notas: [
      "En mayo de 2022 Kylian Mbappé había declarado a la prensa brasileña que en Sudamérica el fútbol no estaba tan avanzado como en Europa.",
      "Gonzalo Montiel convirtió el cuarto penal de la serie definitiva ante Francia en el estadio Lusail el 18 de diciembre de 2022.",
    ],
    dias: [
      {
        situacion: "Come en casa {B}, en Doha.",
        parrafos: [
          "Aire acondicionado en dieciséis grados y tres televisores prendidos al mismo tiempo repitiendo la semifinal contra Croacia. Mientras reviso las acreditaciones para el domingo, {B} camina descalzo sobre la alfombra persa recordando aquellas declaraciones de Mbappé sobre las eliminatorias¹. {BU}: «Dice que en nuestro continente no sabemos jugar porque nunca tuvo que patear un tiro libre en cancha de Quilmes con barro hasta los tobillos. El domingo, cuando vea a ochenta mil argentinos gritándole en la nuca, va a pedir el reglamento en francés».",
          "{YU}: «Nos mandaron dos invitaciones de protocolo para el salón principal de la FIFA con Infantino y Macri». {BU}: «En ese salón comen canapés de salmón tipos que creen que la pelota viene cuadrada adentro de la caja. Yo voy a la tribuna con los muchachos o miro el partido desde la utilería». Se ata un reloj en cada muñeca y pide fideos con tuco a las doce de la noche.",
        ],
      },
      {
        situacion: "Visita al predio de la Universidad, tarde.",
        parrafos: [
          "Entramos por el portón trasero de la concentración para no cruzarnos con las cámaras extranjeras. Los utileros sacan una ronda de mates debajo del alero y {B} se queda sentado sobre un baúl de aluminio mirando de lejos el peloteo de Messi y De Paul. {BU}: «Mirá cómo lleva la pelota pegada al cordón zurdo sin mirar al piso. Ya tiene la cara que teníamos nosotros en México el sábado anterior a los alemanes».",
          "{YU}: «Scaloni está probando si arma línea de cinco o lo pone a Di María desde el arranque». {BU}: «Si lo pone al Fideo abierto contra el lateral de ellos, en media hora les hace un nudo en la cintura. A los europeos cuando los encarás dos veces para adentro se les apaga la computadora». Volvemos en camioneta antes de que empiece la conferencia oficial.",
        ],
      },
      {
        situacion: "Palco del estadio Lusail, noche.",
        parrafos: [
          "Tres a tres después de ciento veinte minutos que me dejaron sin voz y con el saco empapado. Durante toda la serie de penales me aprieta el antebrazo izquierdo con las dos manos hasta que entra el tiro de Montiel² y se desploma sentado en la butaca de pana. {BU}: «El arquero nuestro les comió el corazón antes de que apoyaran la pelota en la cal. Kylian metió tres penales, pero el que jugó el partido entero con el tobillo hinchado fue Leo».",
          "Abajo en el césped le ponen una túnica negra sobre los hombros antes de levantar la copa; en la fila de atrás dos dirigentes de traje comentan que queda desprolijo para la foto. {BU}: «Que se ponga una frazada de hotel si quiere, pero que no la suelte hasta llegar a Ezeiza. Sabés lo que pesa esa copa cuando te la quieren tocar los que nunca transpiraron la camiseta». Lloramos abrazados con un jeque que no habla una palabra de castellano.",
        ],
      },
      {
        situacion: "Sobremesa en el hotel, mediodía.",
        parrafos: [
          "Valijas a medio cerrar en el pasillo antes de salir para el aeropuerto. Traigo traducidos los diarios deportivos de París donde reclaman que en el tercer gol había dos suplentes pisando la raya; {B} revuelve el café con una sonrisa torcida. {BU}: «Cuando nos ganan con un penal inventado a los ochenta y cinco minutos es justicia arbitral, y cuando les pintamos la cara piden medir el pasto con centímetro. Que vayan a reclamarle al comisario de Marsella».",
          "{YU}: «En Europa varios columnistas todavía discuten quién fue el mejor de la historia». {BU}: «Que no discutan más entre argentinos: el trofeo quedó en casa y los inventores del fútbol siguen mirando por televisión desde el sesenta y seis. Ahora Leo va a poder dormir sin que ningún idiota le pida documentos». Guarda tres camisetas transpiradas dentro de su bolso de mano.",
        ],
      },
      {
        situacion: "Terraza sobre la autopista Riccheri, siesta.",
        parrafos: [
          "Cinco millones de personas abajo del sol; desde el techo de una estación de servicio vemos avanzar el micro descapotable a paso de hombre entre el humo de las parrillas. {B} se apoya en la baranda en cuero con un piluso celeste y blanco. {BU}: «En el ochenta y seis llenamos la plaza, pero hoy no entra un alfiler desde Ezeiza hasta el Obelisco. Este país está loco de remate y menos mal que no tiene cura».",
          "{YU}: «Dicen que en la Casa Rosada armaron el balcón y los jugadores no quieren ir». {BU}: «Hacen bien en pegarse la vuelta en helicóptero: los políticos te abrazan cuando traés el oro y te sueltan la mano cuando errás un pase. La fiesta es con el gordo que está colgado del semáforo». Me mancha el pantalón de lino blanco con ceniza del habano.",
        ],
      },
      {
        situacion: "Asado en Villa Devoto, jueves.",
        parrafos: [
          "Primera noche de silencio en el barrio después de tres días de bocinazos sin pausa. Cortamos un vacío a punto sobre la mesa del fondo mientras en la tele pasan de nuevo la atajada del último minuto del suplementario; {B} señala la pierna izquierda del arquero con el cuchillo. {BU}: «Esa gamba estirada vale más que todos los libros que escribieron los técnicos de saco y corbata en cuarenta años. Si esa pelota entraba, hoy estábamos escuchando a los filósofos del fracaso».",
          "{YU}: «Todavía tengo la garganta cerrada de gritar en Doha y ya querés organizar un partido a beneficio el domingo». {BU}: «Para descansar tenemos toda la eternidad, pero este diciembre hay que vivirlo despierto. Traé el termo nuevo que la noche recién empieza». Anoto que son las tres de la mañana y sigue llamando a Rosario para felicitar a la madre del diez.",
        ],
      },
    ],
  },

  "bilardo-ruggeri": {
    resumen:
      "Junio de 1986 en Ciudad de México. Instalada en la concentración del club América en Coapa, la selección argentina dirigida por Carlos Bilardo supera a Inglaterra y Bélgica y vence 3-2 a Alemania Federal en la final del Estadio Azteca.",
    recientes: [
      { fecha: "1986-06-22", descripcion: "Victoria 2-1 ante Inglaterra en cuartos de final en el Estadio Azteca." },
    ],
    proximos: [
      { fecha: "1986-06-29", descripcion: "Final de la Copa del Mundo ante Alemania Federal con triunfo argentino por 3-2." },
    ],
    saltosDias: [0, 1, 2, 4, 5, 7],
    criticados: ["César Luis Menotti", "Karl-Heinz Rummenigge"],
    alabados: ["José Luis Brown", "Jorge Burruchaga"],
    notas: [
      "Durante el Mundial de México 1986 el plantel argentino se alojó en las instalaciones del club América, en Coapa.",
      "En la final del 29 de junio de 1986 Argentina sufrió dos goles de córner antes del tanto definitivo de Burruchaga.",
    ],
    dias: [
      {
        situacion: "Concentración del América en Ciudad de México.",
        parrafos: [
          "Son las dos y media de la mañana y me golpea la puerta de la pieza con tres videocasetes de Bélgica¹ bajo el brazo. Me refriego los ojos creyendo que pasó una desgracia; {B} entra directo y acomoda dos sillas contra el ropero. {BU}: «El ocho de ellos amaga ir al primer palo y se frena en el punto del penal. Si vos mirás la pelota en vez de mirarle la camiseta, el domingo nos volvemos en barco».",
          "{YU}: «Ayer hicimos cuarenta minutos de centros bajo el sol del mediodía y sacamos todas de cabeza». {BU}: «Ayer era martes y no había público en la tribuna. Los campeonatos se pierden los miércoles a la noche cuando el marcador central duerme demasiado cómodo». Se va a golpearle la puerta al Tata Brown por el mismo pasillo.",
        ],
      },
      {
        situacion: "Comedor de Coapa, mediodía.",
        parrafos: [
          "Traen el almuerzo y veo que esconde los saleros y revisa el punto de la carne con un tenedor. Alguien lee en voz alta una columna publicada en Buenos Aires donde hablan de fútbol vistoso y traición al estilo; {B} se acomoda el nudo de la corbata frente al vidrio. {BU}: «Los que escriben sobre poesía en la cancha nunca tuvieron que marcar a un alemán de metro noventa en el minuto ochenta y ocho. Confunden tirar veinte paredes en la mitad de la cancha con llegar al área».",
          "{YU}: «Si el domingo ganamos la final no van a tener más remedio que pedirte disculpas». {BU}: «Si ganamos van a decir que los rivales eran lentos, y si perdemos nos van a esperar en Ezeiza con los bomberos. Ustedes no lean los diarios y miren el segundo palo». Pide agua mineral tibia y se lleva una manzana en el bolsillo del saco.",
        ],
      },
      {
        situacion: "En el micro, rumbo a la final.",
        parrafos: [
          "Siempre los mismos asientos, la misma canción en el pasacasete y la prohibición terminante de mirar hacia atrás cuando doblamos la esquina de la cancha. {B} va parado al lado del chofer controlando los semáforos con el reloj de pulsera. {BU}: «Si el micro frena dos veces más antes del puente, se nos enfría el calentamiento diez minutos. El chofer maneja como si fuera domingo de paseo en Luján».",
          "{YU}: «Faltan dos horas para el partido y ya estamos frente a los portones». {BU}: «Dos horas en un Mundial son quince minutos de reloj común. Cuando te querés acordar ya sacaron del medio y tenés al nueve rival colgado del hombro». Baja primero para pisar el pasto del área chica.",
        ],
      },
      {
        situacion: "Vestuario del Azteca, tarde.",
        parrafos: [
          "Acabamos de salir campeones del mundo tres a dos, todo el plantel salta arriba de las mesas con la copa y {B} camina de una punta a la otra mirándose los zapatos con una bronca que asusta. Me acerco con la medalla colgada del cuello para abrazarlo. {BU}: «Nos hicieron dos goles de córner en el área chica² como si fuéramos un equipo de solteros contra casados. Dos años practicando la cortina en el primer palo para que cabeceen solos en el segundo».",
          "{YU}: «Salimos campeones del mundo, al menos sonreí para los fotógrafos que entraron al vestuario». {BU}: «A los fotógrafos les sonríen los candidatos a intendente. A mí de esta tarde me quedan grabados los dos cabezazos de ellos». Se encierra diez minutos en la ducha con la ropa puesta.",
        ],
      },
      {
        situacion: "Cena de festejo en el hotel.",
        parrafos: [
          "Aparece el Tata Brown todavía con el agujero hecho a diente en la camiseta para aguantar el hombro sacado. {B} lo señala desde la cabecera como si explicara una lámina de anatomía en la facultad. {BU}: «Ahí tienen lo que vale un médico que sabe jugar de cinco y de líbero. Un jugador europeo con ese hombro pide ambulancia y tres semanas de balneario en Suiza».",
          "{YU}: «Durante los últimos diez minutos el Tata despejaba con la pierna izquierda para no mover el brazo». {BU}: «Para despejar a la tribuna no hace falta el brazo, hace falta entender el reloj. Cuando faltan cinco minutos la pelota tiene que viajar con nieve en el lomo». No prueba ni media copa de champán en toda la noche.",
        ],
      },
      {
        situacion: "Vuelo a Buenos Aires, mañana.",
        parrafos: [
          "Mientras todos duermen desparramados en la cabina, lo veo en la fila cuatro anotando nombres en una libreta chica con birome azul. Me siento en el brazo del asiento y le pregunto qué está pasando en limpio. {BU}: «La lista de Italia noventa y los amistosos del año que viene en Europa. Hoy a las doce de la noche ya somos el equipo al que todos le quieren ganar».",
          "{YU}: «Todavía no aterrizamos en Ezeiza ni le mostramos la copa a la familia». {BU}: «La copa ya está en el bolso del utilero y pertenece a la historia antigua. El que festeja más de cuarenta y ocho horas seguidas pierde el primer salto de cabeza en la eliminatoria». Cierra la libreta y me manda a dormir porque dice que tengo ojeras.",
        ],
      },
    ],
  },

  "solari-rocambole": {
    resumen:
      "Agosto y septiembre de 1986 entre La Plata y Buenos Aires. Mientras Patricio Rey y sus Redonditos de Ricota terminan de mezclar «Oktubre», el Indio Solari y Rocambole definen en el taller platense el arte de tapa en rojo, negro y gris antes de las presentaciones en Paladium.",
    recientes: [
      { fecha: "1986-07-25", descripcion: "Cierre de las sesiones de grabación de «Oktubre» en los estudios Panda con Osvaldo Fattoruso como invitado." },
    ],
    proximos: [
      { fecha: "1986-10-04", descripcion: "Salida a la calle del segundo álbum de la banda, «Oktubre»." },
      { fecha: "1986-10-18", descripcion: "Presentación oficial de «Oktubre» en dos funciones en la discoteca Paladium de Buenos Aires." },
    ],
    saltosDias: [0, 3, 6, 10, 14, 19],
    criticados: ["un cronista del suplemento joven", "Luca Prodan"],
    alabados: ["Skay Beilinson", "Enrique Symns"],
    notas: [
      "La tapa de «Oktubre» (1986), realizada por Rocambole (Ricardo Cohen), se inspiró en la gráfica constructivista con tipografía quebrada.",
      "El disco fue presentado en octubre de 1986 en el teatro Paladium de la calle Reconquista, en el bajo porteño.",
    ],
    dias: [
      {
        situacion: "Taller de Rocambole en La Plata, con la tapa de Oktubre.",
        parrafos: [
          "Olor a aguarrás, cartones manchados de témpera roja y una estufa a querosén que calienta de un solo lado. Muestro tres bocetos con banderas y multitudes¹ sobre el tablero; {B} se acerca con los anteojos oscuros puestos a pesar de la penumbra. {BU}: «Sacale todas las caras reconocibles. Cuando dibujás una cara, la gente busca a su primo; cuando dejás la sombra y el trapo rojo, cada uno escucha su propio miedo».",
          "{YU}: «Por culpa del cartón barato, en el taller gráfico temen que el negro tan empastado se corra». {BU}: «Que se corra un milímetro le hace bien al dibujo. La prolijidad gráfica es para las cajas de remedios y los discos de melódico». Elige la cartulina más áspera del estante y se prepara un gin tonic sin limón.",
        ],
      },
      {
        situacion: "Viaje en tren a Constitución.",
        parrafos: [
          "Vagón de madera casi vacío a las once de la mañana; por la ventanilla pasan los terrenos baldíos de Avellaneda y el humo de las fábricas cerradas. Un diario olvidado en el asiento trae una nota sobre el rock moderno y los peinados de salón; {B} lo dobla en cuatro sin abrirlo. {BU}: «Escriben sobre guitarras como si comentaran una liquidación de camisas importadas. Creen que una distorsión nueva reemplaza el no tener nada para decir».",
          "{YU}: «Al menos este mes escribieron nuestros apellidos sin errores de imprenta». {BU}: «Cuando los suplementos escriben bien tu nombre, es señal de que estás sonando demasiado bajito. Hay que subir el bajo en la mezcla del lunes». Baja al andén con el cuello del sobretodo levantado hasta las orejas.",
        ],
      },
      {
        situacion: "Bar de la diagonal, medianoche.",
        parrafos: [
          "Mesas de fórmica verde y parroquianos jugando al dominó en el fondo. {YU}: «Temo que Symns se pase de rosca en el monólogo de Buenos Aires y espante a media sala». {BU}: «El público no paga la entrada para que lo traten con educación municipal. Si querés modales de confitería, contratás a un locutor de casamientos».",
          "Desde una mesa vecina alguien nombra a Luca Prodan y sus declaraciones en una revista subterránea. {BU}: «Se hace el marinero borracho en los bares de San Telmo, pero mide los silencios con cronómetro inglés. La mitad del personaje se lo arman los fotógrafos que nunca vieron un puerto». Pide otra vuelta de ginebra antes de que cierren la caja.",
        ],
      },
      {
        situacion: "Sala de ensayo en City Bell.",
        parrafos: [
          "Humedad de arboleda y cables cruzados por el piso de baldosas. Skay prueba el arpegio inicial de «Jijiji» con una guitarra limpia que parece un cuchillo frío; {B} lo escucha sentado sobre un baúl de equipos sin tocar el micrófono. {BU}: «El Flaco toca tres notas y ya armó el cine entero. Después entro yo a arruinarle el silencio con sustantivos».",
          "{YU}: «Puedo proyectar seis diapositivas pintadas a mano sobre el telón durante ese tema». {BU}: «Nada que compita con el riff. Cuando la guitarra muerde así, un dibujo en la pared es como ponerle subtítulos a un incendio». Guardo las diapositivas en el bolsillo de la campera sin discutir.",
        ],
      },
      {
        situacion: "Imprenta de Barracas, tarde.",
        parrafos: [
          "Ruido de guillotinas industriales y pliegos recién salidos de la máquina que largan vapor de tinta fresca. El jefe de taller nos advierte que la tipografía quebrada del título parece un defecto de matricería; {B} toma una lámina húmeda de la pila y la mira al trasluz. {BU}: «Dígale al matricero que no corrija nada. Lo único intolerable en un sobre de cartón es que parezca hecho por una oficina pública».",
          "Firmamos la orden de tirada sobre un tambor de solvente. A la salida me comenta que le arde la garganta por el polvillo de papel, pero compra dos atados de cigarrillos negros en la esquina.",
        ],
      },
      {
        situacion: "Camarín de Paladium, antes del show.",
        parrafos: [
          "Paredes transpiradas del bajo porteño y el piso vibrando por la gente que salta arriba desde hace una hora. Carmen reparte las entradas en la puerta para que ningún intermediario se quede con un peso; {B} se acomoda la camisa oscura frente a un vidrio manchado. {BU}: «Si algún día llenamos un estadio, el secreto va a ser no aparecer nunca en televisión. La gente va a buscar lo que no le regalan en el comedor de la casa».",
          "{YU}: «Quedaron trescientas personas afuera sobre la calle Reconquista²». {BU}: «Mejor que se queden con la duda de cómo sonó. El mito lo fabrican siempre los que no consiguieron entrada». Se apagan las luces del pasillo y sale al escenario sin mirar atrás.",
        ],
      },
    ],
  },

  "musk-trump": {
    resumen:
      "Noviembre de 2024 en Palm Beach y Texas. Tras la victoria presidencial del 5 de noviembre en los Estados Unidos, Donald Trump y Elon Musk comparten cenas en la terraza de Mar-a-Lago, arman los nombramientos del gabinete y asisten en Boca Chica al sexto vuelo de prueba del cohete Starship.",
    recientes: [
      { fecha: "2024-10-13", descripcion: "SpaceX logra atrapar por primera vez el propulsor Super Heavy en los brazos mecánicos de la torre en Texas." },
      { fecha: "2024-11-05", descripcion: "Jornada electoral presidencial en los Estados Unidos celebrada desde el salón principal de Mar-a-Lago." },
    ],
    proximos: [
      { fecha: "2024-11-12", descripcion: "Anuncio formal de la comisión de recorte del gasto público (DOGE) junto a Vivek Ramaswamy." },
      { fecha: "2024-11-19", descripcion: "Sexto lanzamiento de prueba de Starship en Boca Chica con ambos presentes en la plataforma." },
    ],
    saltosDias: [0, 2, 5, 8, 11, 14],
    criticados: ["Jerome Powell", "Jeff Bezos"],
    alabados: ["Gwynne Shotwell", "Howard Lutnick"],
    notas: [
      "Durante noviembre de 2024 las reuniones de transición presidencial tuvieron lugar en el club Mar-a-Lago, en Palm Beach.",
      "El sexto vuelo integrado de Starship se realizó el 19 de noviembre de 2024 en la base de Boca Chica, Texas.",
    ],
    dias: [
      {
        situacion: "Cena en el patio de Mar-a-Lago.",
        parrafos: [
          "Mesas con manteles blancos bajo las palmeras¹ y veinte aspirantes a ministros haciendo fila cerca del bufé. {B} corta su carne demasiado cocida mientras mira un gráfico de presupuestos federales en el teléfono. {BU}: «Hay cuatrocientas agencias cuyos empleados solo producen formularios para otras agencias. Si apagás los servidores un viernes, el lunes no se entera ni el sereno».",
          "{YU}: «En el Congreso viven de inaugurar esas oficinas en sus estados». {BU}: «Los senadores son como el código bancario de los años ochenta: nadie sabe qué línea sirve, pero da miedo borrarla. Yo borro primero y espero a ver quién reclama». Pide otro vaso de gaseosa dietética con hielo hasta el borde.",
        ],
      },
      {
        situacion: "Desayuno junto al campo de golf.",
        parrafos: [
          "Llega en carrito eléctrico manejando a demasiada velocidad por el sendero de grava. Alguien en la mesa menciona a Jeff Bezos y su diario de Washington; {B} apoya la taza en el plato sin probarla. {BU}: «Construyó un cohete que sube derecho diez minutos y baja en paracaídas como un juguete caro. En órbita no hay editores que te corrijan la gravedad».",
          "{YU}: «Al menos este año el diario evitó respaldar a nuestra rival». {BU}: «Eso no es valentía, es contabilidad tardía. Cuando el viento cambia, todos descubren la neutralidad periodística». Se calza una gorra negra que le tapa media frente y sale a revisar el césped del hoyo cuatro.",
        ],
      },
      {
        situacion: "Salón dorado, después del mediodía.",
        parrafos: [
          "Entrevistamos candidatos para el Tesoro con tres carpetas abiertas sobre la alfombra. Un banquero de Nueva York habla durante quince minutos seguidos de estabilidad institucional; {B} tamborilea con los dedos sobre el brazo del sillón. {BU}: «Usa palabras largas para esconder que le gusta perder plata despacio. La prudencia de Wall Street consiste en cobrar comisión mientras se hunde el barco».",
          "{YU}: «En los canales financieros dicen que cae muy bien y tranquiliza al mercado». {BU}: «La buena prensa es el certificado de defunción de las ideas útiles. Necesitamos un contador que duerma mal, no un presentador con corbata». A las cinco me duele la cabeza por el volumen de los parlantes en el comedor.",
        ],
      },
      {
        situacion: "Vuelo privado rumbo a Washington.",
        parrafos: [
          "Cabina llena de asesores que fingen leer memorandos cuando pasamos caminando. {B} conecta una terminal satelital sobre la mesita plegable para medir la velocidad de descarga en pleno vuelo. {BU}: «Los reguladores tardaron dieciocho meses en autorizar una antena que instalamos en cuatro minutos. Creen que el expediente es una ley de la física».",
          "{YU}: «Powell volvió a declarar que no piensa apurar la baja de tasas». {BU}: «Calcula la inflación mirando por el espejo retrovisor de hace seis meses. Manejar así en una autopista de Texas te garantiza terminar en la zanja». Se queda dormido sentado con el teléfono encendido en la mano.",
        ],
      },
      {
        situacion: "Plataforma de Boca Chica, tarde.",
        parrafos: [
          "Viento salado del golfo y una torre de acero que parece un rascacielos colgado de dos pinzas². {B} señala las toberas del propulsor con orgullo de mecánico de taller. {BU}: «La gente cree que lo difícil es el fuego, pero el fuego es gratis. Lo difícil es que la válvula no se congele medio segundo antes del giro».",
          "{YU}: «Vista desde acá abajo la mole mete miedo; ¿qué pasa si falla la captura en la torre?». {BU}: «Aprendemos más rápido cuando explota algo caro. Los ingenieros que nunca rompieron un motor solo sirven para escribir informes en PowerPoint».",
        ],
      },
      {
        situacion: "Llamada nocturna desde Palm Beach.",
        parrafos: [
          "Son las dos de la mañana y me despierta para leerme un mensaje que acaba de publicar sobre el presupuesto de aviones de guerra. {YU}: «A esta hora solo están despiertos los insomnes y los periodistas resentidos». {BU}: «Son el mismo gremio, pero unos cobran sueldo fijo. Si los dejás dormir tranquilos, a las nueve de la mañana ya inventaron una subcomisión».",
          "Promete irse a acostar en diez minutos. Cerca del amanecer compruebo que subió seis gráficos más sobre turbinas y una encuesta sobre Marte.",
        ],
      },
    ],
  },

  "scorsese-deniro": {
    resumen:
      "Mayo de 2023 en la Costa Azul y Nueva York. Martin Scorsese y Robert De Niro presentan en el Festival de Cannes su décima película juntos, «Killers of the Flower Moon», a cincuenta años del estreno de «Mean Streets».",
    recientes: [
      { fecha: "2023-05-16", descripcion: "Apertura de la 76.ª edición del Festival Internacional de Cine de Cannes." },
    ],
    proximos: [
      { fecha: "2023-05-20", descripcion: "Estreno mundial de «Killers of the Flower Moon» en el Grand Théâtre Lumière de Cannes." },
      { fecha: "2023-05-21", descripcion: "Conferencia de prensa oficial del elenco y equipo técnico en el Palais des Festivals." },
    ],
    saltosDias: [0, 1, 2, 4, 7, 11],
    criticados: ["un ejecutivo de plataformas", "Paul Schrader"],
    alabados: ["Thelma Schoonmaker", "Michael Powell"],
    notas: [
      "Scorsese y De Niro habían presentado «Taxi Driver» en el Festival de Cannes en mayo de 1976.",
      "«Killers of the Flower Moon» (2023), montada por Thelma Schoonmaker, tiene una duración de 206 minutos.",
    ],
    dias: [
      {
        situacion: "Almuerzo en el hotel de Cannes antes del estreno.",
        parrafos: [
          "Terraza frente al Mediterráneo con viento fuerte que vuela las servilletas de hilo. {B} habla a toda velocidad mientras acomoda tres pares de anteojos distintos al lado de la panera. {BU}: «Los distribuidores me pidieron cortar veinticinco minutos antes de viajar. Les contesté que si querían llegar temprano a cenar, se quedaran en el restaurante desde las siete».",
          "{YU}: «Tres horas y media en smoking hacen sufrir las rodillas de cualquiera». {BU}: «En mil novecientos setenta y seis nos silbaron la mitad de la función¹ y salimos a comer pasta igual. Ahora aplauden de pie hasta los avisos de relojes suizos». Pide un café expreso y el médico le retira la taza de la mano.",
        ],
      },
      {
        situacion: "Sala Lumière, medianoche.",
        parrafos: [
          "Nueve minutos de aplausos con las luces encendidas y la cámara de protocolo apuntándonos a la cara como en una comisaría. {YU}: «Durante la escena del porche con DiCaprio me quedó un gesto demasiado cargado en la boca». {BU}: «Thelma dejó ese plano porque mentís con los hombros antes de abrir la boca. Si te sacaba dos fotogramas, parecías un tío bueno».",
          "Un cronista francés pregunta a los gritos desde la alfombra si esta será nuestra última película juntos. {BU}: «Hace cuarenta años que nos despiden en todos los festivales. Van a jubilarse ellos antes que nuestra cámara». Ya dentro del auto se afloja el moño y respira hondo por el asma.",
        ],
      },
      {
        situacion: "Desayuno en la suite, domingo.",
        parrafos: [
          "Diarios europeos desparramados sobre la alfombra y olor a tostadas frías. Leo en voz alta una reseña que habla de «contenido audiovisual para plataformas»; {B} se acomoda las cejas con dos dedos. {BU}: «Llaman contenido a una película como quien llama relleno a una lasaña. Para un contador de California, Dreyer y un aviso de detergente son dos archivos del mismo peso».",
          "{YU}: «Esa misma plataforma pagó los doscientos millones del rodaje en Oklahoma». {BU}: «Los Médici también eran banqueros insoportables y nadie viaja a Florencia para mirar sus libros de caja». Se guarda tres sobres de azúcar en el bolsillo del saco por pura costumbre de barrio.",
        ],
      },
      {
        situacion: "Vuelo de regreso a Nueva York.",
        parrafos: [
          "Cruzamos el Atlántico con una copia restaurada de una película inglesa de mil novecientos cuarenta y ocho en el monitor. {B} detiene la imagen cada cuatro minutos para señalarme el color de una cortina o la sombra de una escalera. {BU}: «Mirá cómo iluminaban el terciopelo rojo con tres lámparas de carbón. Hoy tenés cien pantallas digitales en el camión y el rojo parece salsa de tomate de lata».",
          "Me duermo a mitad del segundo acto; cuando abro los ojos, sigue tomando notas en una libreta amarilla. {BU}: «Te perdiste el único movimiento de grúa que vale la pena robar el año que viene. Menos mal que vos solo tenés que pararte adelante de la lente».",
        ],
      },
      {
        situacion: "Sala de montaje en la calle Cincuenta y Siete.",
        parrafos: [
          "Paso a saludar a Thelma Schoonmaker² y terminamos revisando latas viejas de los años setenta. {B} menciona un guion nuevo que le mandó Schrader por correo la semana pasada. {BU}: «En la página diez el protagonista ya escribió tres diarios íntimos y compró un revólver. Los calvinistas creen que si nadie sufre antes del desayuno, la escena no tiene moral».",
          "{YU}: «A mí esa clase de personajes callados siempre me ahorró estudiar letra». {BU}: «Vos en los setenta tachabas media página de diálogo con lápiz negro antes de entrar al decorado. Aprendí a mover la cámara porque no querías hablar». Thelma confirma el dato sin despegar los ojos de la moviola.",
        ],
      },
      {
        situacion: "Come en casa {B}.",
        parrafos: [
          "Cenamos en mi departamento de Tribeca con las ventanas cerradas por la humedad del río. {B} revisa la fuente de pasta y se sirve una porción mínima. {BU}: «La cocina moderna consiste en poner una hoja de albahaca parada en el medio de un plato vacío. Mi madre con dos tomates en conserva daba de comer a seis personas y sobraba para el domingo».",
          "{YU}: «El médico te prohibió la salsa pesada después de las nueve». {BU}: «Los médicos quieren que uno viva cien años comiendo papel secante. Para eso prefiero quedarme en el primer corte de montaje». Se va a las once y media llevándose prestado un libro sobre barcos del siglo dieciocho.",
        ],
      },
    ],
  },

  "alcaraz-ferrero": {
    resumen:
      "Julio de 2024 en Londres. Carlos Alcaraz y su entrenador Juan Carlos Ferrero conviven en una casa alquilada en Wimbledon Village durante la segunda semana del campeonato, antes y después de vencer a Daniil Medvédev en semifinales y a Novak Djokovic en la final.",
    recientes: [
      { fecha: "2024-06-09", descripcion: "Alcaraz conquista su primer Roland Garros en París venciendo a Alexander Zverev en cinco sets." },
      { fecha: "2024-07-09", descripcion: "Triunfo en cuartos de final de Wimbledon ante Tommy Paul en cuatro parciales." },
    ],
    proximos: [
      { fecha: "2024-07-12", descripcion: "Semifinal de Wimbledon ante Daniil Medvédev en la cancha central (6-7, 6-3, 6-4, 6-4)." },
      { fecha: "2024-07-14", descripcion: "Final de Wimbledon contra Novak Djokovic con victoria por 6-2, 6-2 y 7-6." },
    ],
    saltosDias: [0, 1, 2, 3, 4, 6],
    criticados: ["Alexander Zverev", "un comentarista británico"],
    alabados: ["Roger Federer", "Rafael Nadal"],
    notas: [
      "Durante el torneo de Wimbledon el equipo de Alcaraz alquila cada año una vivienda a pocas cuadras del All England Club.",
      "La final del 14 de julio de 2024 repitió el cruce del año anterior en Wimbledon ante Novak Djokovic.",
    ],
    dias: [
      {
        situacion: "Cena en la casa alquilada en Wimbledon.",
        parrafos: [
          "Arroz blanco con pescado y las raquetas recién encordadas apoyadas contra el sillón del comedor¹. {YU}: «Mañana contra Medvédev no abuses de la dejada desde tres metros atrás de la línea». {BU}: «Él espera la devolución tan lejos que casi paga entrada en la primera fila. Si no le tiro una corta en el primer juego, se instala en el telón de fondo toda la tarde».",
          "{YU}: «El ruso corre hacia adelante mucho mejor de lo que parece por televisión». {BU}: «Corre rápido, pero llega enojado. Cuando un tipo alto tiene que agacharse dos veces seguidas, el tercer tiro lo manda a la red por orgullo». Se levanta a buscar helado a la cocina; tras mi mirada vuelve con una manzana verde.",
        ],
      },
      {
        situacion: "Vestuario del club, tarde.",
        parrafos: [
          "Acaba de ganarle a Medvédev después de regalar el primer set por apurarse en el desempate. Mientras el fisioterapeuta le estira el gemelo, le reprocho esos quince minutos de distracción en los que miraba hacia nuestro palco. {BU}: «No pedía socorro, buscaba a alguien que tuviera cara de tranquilo. Vos tenías el ceño tan fruncido que daban ganas de tirar otra dejada para aflojarte».",
          "En el televisor sin sonido un exjugador inglés señala un gráfico de errores no forzados. {BU}: «Para los ingleses la madurez táctica consiste en perder en cuartos de final sin mancharse las medias. Prefiero equivocarme subiendo a la red».",
        ],
      },
      {
        situacion: "Peloteo matinal sobre césped.",
        parrafos: [
          "Cancha de entrenamiento número cuatro, con el pasto ya gastado en el medio y olor a tierra húmeda. Ensayamos el saque abierto del lado de la ventaja para mover la rodilla operada de Djokovic; {B} clava cuatro seguidos sobre el fleje de cal. {BU}: «Si le das ritmo al centro, juega sentado desde el sillón de su casa. Hay que hacerlo pensar con los pies antes que con la muñeca».",
          "{YU}: «En esta misma cancha Federer parecía no hacer ruido al pisar». {BU}: «Federer jugaba como si el aire no pesara nada. Al resto nos toca empujar la pelota con el hombro». Guarda tres pelotas nuevas en el bolsillo del pantalón corto para seguir probando globos.",
        ],
      },
      {
        situacion: "Balcón de los campeones, domingo.",
        parrafos: [
          "Tres sets limpios contra Djokovic², salvo esos diez minutos del cinco-cuatro en que se le encogió el brazo con tres pelotas de campeonato. Antes de salir a saludar con el trofeo dorado, le pregunto qué pensó en el cuarenta-iguales. {BU}: «Pensé que si perdía ese juego me ibas a hablar del primer saque durante todo el vuelo a Madrid. Gané el desempate por defensa propia».",
          "Abajo aplauden socios con corbata violeta y sombrero de paja. {BU}: «Tienen cara de haber aplaudido igual en mil novecientos veinte. Por suerte hoy no nos hicieron esperar bajo el paraguas».",
        ],
      },
      {
        situacion: "Aeropuerto de Heathrow, mañana.",
        parrafos: [
          "Pasamos los controles con los bolsos de raquetas y la réplica de la copa envuelta en papel de burbujas dentro de una caja de cartón. Un empleado de seguridad pregunta si llevamos algún objeto punzante; {B} señala mi libreta de notas. {BU}: «Ahí adentro hay planillas de porcentajes de saque que lastiman más que cualquier tijera».",
          "{YU}: «Zverev volvió a quejarse en prensa del peso de las pelotas de este mes». {BU}: «Cuando uno gana, la pelota es redonda; cuando pierde, siempre tiene pelos de más. Nadal ganó catorce veces en París con pelotas de plomo, de corcho y de barro sin preguntar la marca». Compra dos bolsas de gomitas en el quiosco creyendo que no lo veo.",
        ],
      },
      {
        situacion: "Academia de Villena, mediodía.",
        parrafos: [
          "Treinta y seis grados al sol en Alicante; pasamos del césped londinense al polvo de ladrillo seco en cuarenta y ocho horas. Los chicos de la escuela dejan de pelotear para mirarlo pasar, pero {B} va directo a su banco de sombra. {BU}: «Acá la pelota pica a la altura de la oreja y nadie te alcanza la toalla en bandeja. En cinco minutos se te pasa el traje de etiqueta».",
          "{YU}: «Mañana arrancamos a las ocho y media con pasadas largas de fondo». {BU}: «A las nueve. Los campeones de Wimbledon tienen media hora de descuento en julio». Anoto que mañana a las ocho y veinte va a estar esperando en la puerta con las zapatillas puestas.",
        ],
      },
    ],
  },
};

/**
 * Generador de respaldo para cualquier pareja fuera de los ejemplos (cuando no hay
 * GEMINI_API_KEY activa o falla la red). Procede siempre, incluso en cruces ucrónicos.
 */
function diarioRespaldoLibre(p: Parametros, v: Validacion, fechas: string[]) {
  const B = apellidoDe(v.borges);
  const BU = B.toUpperCase();
  const YU = apellidoDe(v.bioy).toUpperCase();
  const C = p.criticados[0] ?? "un colega muy elogiado en los suplementos";
  const A = p.alabados[0] ?? "un viejo maestro del oficio";
  const T = p.tema ?? "las vanidades del gremio";
  const escena = p.escena ?? `Come en casa ${B}`;

  const entradasBase = [
    {
      situacion: `Come en casa ${B}.`,
      parrafos: [
        `Hablamos de ${T}¹ y de la manía contemporánea de explicarlo todo en voz alta. ${BU}: «La gente cree que una opinión mejora cuando la repite tres veces en los diarios. En nuestro oficio basta con acertar un detalle técnico y callarse el resto de la tarde».`,
        `${YU}: «A veces conviene aclarar las intenciones para que los críticos no inventen otra cosa». ${BU}: «Los críticos inventan igual, pero con peores adjetivos. Explicar una obra es confesar que salió fallida desde el arranque». Pide un café chico, lo prueba y lo deja por la mitad.`,
      ],
    },
    {
      situacion: "Hablamos por teléfono, tarde.",
      parrafos: [
        `Llama para comentarme unas declaraciones de ${C} que leyó después del almuerzo. ${BU}: «Habla como si hubiera descubierto la pólvora el martes pasado. Confunde el ruido de las entrevistas con el trabajo bien hecho».`,
        `Intento una defensa tibia por pura cortesía gremial. ${YU}: «En sus primeros años tuvo dos o tres aciertos dignos». ${BU}: «Dos aciertos en veinte años los tiene hasta un reloj parado. El problema es lo que hace en el tiempo libre entre acierto y acierto». Corta sin despedirse porque le tocan el timbre.`,
      ],
    },
    {
      situacion: "Almorzamos en un bodegón.",
      parrafos: [
        `Mesa del rincón junto a la ventana y mantel de papel. Revisamos línea por línea un trabajo nuevo que nos mandaron esta semana; ${B} aprueba el comienzo pero descarta el resto con un gesto de la mano. ${BU}: «Los primeros cinco minutos son honestos; después entra la vanidad y arruina la proporción. Se nota el momento exacto en que el autor empezó a mirarse en el vidrio».`,
        `${YU}: «A mí el final me pareció bastante eficaz». ${BU}: «Eficaz es una palabra que usan los vendedores de seguros. Cuando algo necesita ser eficaz es porque ya renunció a ser verdadero». Yo, por adulación o por cansancio, le doy la razón antes de que traigan la cuenta.`,
      ],
    },
    {
      situacion: "Caminata nocturna por el barrio.",
      parrafos: [
        `Salimos a dar una vuelta después de las diez con fresco de otoño. Al pasar frente a un quiosco iluminado surge el nombre de ${A}; el tono de ${B} cambia de inmediato. ${BU}: «Con ${A} uno aprendía sin darse cuenta de que le estaban enseñando. Resolvía lo más difícil como quien se abrocha el sobretodo al salir».`,
        `${YU}: «Casi nadie lo nombra hoy en las revistas del gremio». ${BU}: «Mejor para él: así lo leen solo los que buscan aprender el oficio y no los que buscan una cita para lucirse en una cena». Doblamos por una cuadra oscura y camina en silencio hasta la esquina.`,
      ],
    },
    {
      situacion: "Sobremesa del jueves.",
      parrafos: [
        `Trae una libreta vieja con anotaciones tachadas y me lee tres líneas que rescató de una mudanza. ${BU}: «Todo lo que uno escribe después de las doce de la noche parece profundo hasta que sale el sol. A las nueve de la mañana sobran todos los adverbios».`,
        `${YU}: «Entonces habría que trabajar solamente en horario de oficina». ${BU}: «En horario de oficina uno recibe visitas inútiles como las de hoy. La ventaja de la mañana es que los pelmas todavía están durmiendo». Se queja de una molestia en el estómago y pide agua mineral sin gas.`,
      ],
    },
    {
      situacion: "Paso a buscarlo al mediodía.",
      parrafos: [
        `Baja quince minutos tarde y le echa la culpa al ascensor del edificio. Volvemos a mencionar a ${C} y el premio que acaba de darle una comisión de notables. ${BU}: «Los premios existen para que veinte señores con corbata salgan en la fotografía al lado del ganador. A los seis meses nadie recuerda el premio, pero la foto sigue dando vergüenza».`,
        `${YU}: «Si te lo dieran este año no tendrías más remedio que ir a recibirlo». ${BU}: «Mandaría a un primo lejano con un discurso de cuatro palabras. La gratitud pública siempre suena a pedido de disculpas». Nos despedimos en la avenida porque amenaza llover.`,
      ],
    },
  ];

  const fechasActivas = fechas.slice(0, entradasBase.length);
  return {
    dias: fechasActivas.map((fecha, i) => ({
      fecha,
      situacion: entradasBase[i].situacion,
      parrafos: entradasBase[i].parrafos,
    })),
    notas: [
      `Crónica apócrifa compuesta en torno a las conversaciones entre ${v.borges.nombre} y ${v.bioy.nombre}.`,
    ],
    escena,
    criticados: [C],
    alabados: [A],
  };
}

function validacionMock(p: Parametros) {
  const hallado = buscarPareja(p.borges, p.bioy);
  if (!hallado) {
    const apB = apellidoDe({ nombre: p.borges });
    const apY = apellidoDe({ nombre: p.bioy });
    return {
      aceptado: true,
      justificacion: `Encuentro apócrifo entre ${p.borges} y ${p.bioy}.`,
      relacion: `Trato y conversaciones de sobremesa entre ${p.borges} y ${p.bioy}.`,
      inicioRelacion: null,
      inicioAproximado: true,
      ambito: "cultura",
      borges: {
        nombre: p.borges,
        conocido: true,
        descripcion: "figura pública",
        nacimiento: null,
        muerte: null,
        apodos: [],
        apellido: apB,
      },
      bioy: {
        nombre: p.bioy,
        conocido: true,
        descripcion: "diarista e interlocutor",
        nacimiento: null,
        muerte: null,
        apodos: [],
        apellido: apY,
      },
      noVerificados: [],
      fuentes: [],
    };
  }
  const { par } = hallado;
  return {
    aceptado: true,
    justificacion: par.relacion,
    relacion: par.relacion,
    inicioRelacion: par.inicioRelacion,
    inicioAproximado: par.inicioAproximado,
    ambito: par.ambito,
    borges: {
      nombre: par.borges.nombre,
      descripcion: par.borges.descripcion,
      nacimiento: par.borges.nacimiento,
      muerte: par.borges.muerte,
      apodos: par.borges.apodos,
      apellido: par.borges.corto,
      conocido: true,
    },
    bioy: {
      nombre: par.bioy.nombre,
      descripcion: par.bioy.descripcion,
      nacimiento: par.bioy.nacimiento,
      muerte: par.bioy.muerte,
      apodos: par.bioy.apodos,
      apellido: par.bioy.corto,
      conocido: true,
    },
    noVerificados: [],
    fuentes: par.fuentes,
  };
}

function contextoMock(
  p: Parametros,
  v: Validacion,
  w: { desde: string; hasta: string; n: number },
) {
  const hallado = buscarPareja(p.borges, p.bioy);
  if (!hallado) {
    const saltos = [0, 2, 5, 8, 12, 16].slice(0, Math.min(w.n, 6));
    return {
      resumen: `Período de conversaciones entre ${v.borges.nombre} y ${v.bioy.nombre} a partir del ${w.desde}.`,
      recientes: [],
      proximos: [],
      fechasSugeridas: saltos.map((d) => sumarDias(w.desde, d)),
      escenaSugerida: p.escena ?? `Come en casa ${apellidoDe(v.borges)}`,
      criticadosSugeridos: p.criticados.length ? p.criticados : ["un contemporáneo de moda"],
      alabadosSugeridos: p.alabados.length ? p.alabados : ["un clásico del oficio"],
      fuentes: [],
    };
  }
  const id = hallado.par.id;
  const diario = DIARIOS_POR_ID[id] ?? DIARIOS_POR_ID["borges-bioy"];
  const saltos = diario.saltosDias.slice(0, Math.min(w.n, diario.dias.length));
  return {
    resumen: diario.resumen,
    recientes: diario.recientes,
    proximos: diario.proximos,
    fechasSugeridas: saltos.map((d) => sumarDias(w.desde, d)),
    escenaSugerida: hallado.par.escenaEjemplo ?? `Come en casa ${apellidoDe(v.borges)}`,
    criticadosSugeridos: diario.criticados,
    alabadosSugeridos: diario.alabados,
    fuentes: hallado.par.fuentes ?? [],
  };
}

function entradaMock(
  p: Parametros,
  v: Validacion,
  c: Contexto,
  fechas: string[],
) {
  const hallado = buscarPareja(p.borges, p.bioy);
  if (!hallado) {
    return diarioRespaldoLibre(p, v, fechas);
  }
  const id = hallado.par.id;
  const diario = DIARIOS_POR_ID[id] ?? DIARIOS_POR_ID["borges-bioy"];
  const B = apellidoDe(v.borges);
  const BU = B.toUpperCase();
  const YU = apellidoDe(v.bioy).toUpperCase();
  const escena = p.escena ?? c.escenaSugerida ?? diario.dias[0].situacion.replaceAll("{B}", B);

  const fechasActivas = fechas.slice(0, diario.dias.length);
  const dias = fechasActivas.map((fecha, i) => {
    const plantilla = diario.dias[i];
    return {
      fecha,
      situacion: plantilla.situacion.replaceAll("{BU}", BU).replaceAll("{YU}", YU).replaceAll("{B}", B),
      parrafos: plantilla.parrafos.map((pr) =>
        pr.replaceAll("{BU}", BU).replaceAll("{YU}", YU).replaceAll("{B}", B),
      ),
    };
  });

  return {
    dias,
    notas: diario.notas,
    escena,
    criticados: p.criticados.length ? p.criticados : diario.criticados,
    alabados: p.alabados.length ? p.alabados : diario.alabados,
  };
}

export function mockText(): TextProvider {
  return {
    nombre: "mock",
    async generar(req: TextRequest): Promise<TextResponse> {
      const { parametros: p, validacion: v, contexto: c } = req.meta;
      let obj: unknown;
      if (req.tarea === "validacion") obj = validacionMock(p);
      else if (req.tarea === "contexto")
        obj = contextoMock(p, v!, req.meta.ventana ?? { desde: p.fecha, hasta: p.fecha, n: 1 });
      else if (req.tarea === "revision") obj = req.meta.borrador;
      else obj = entradaMock(p, v!, c!, req.meta.fechas ?? [p.fecha]);
      return { texto: JSON.stringify(obj), fuentes: [], conBusquedaWeb: false };
    },
  };
}
