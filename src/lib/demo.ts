/**
 * Parejas de ejemplo para la botonera inicial y el modo local.
 */

export type AmbitoDemo =
  | "literatura"
  | "fútbol"
  | "música"
  | "política"
  | "tenis"
  | "tecnología"
  | "cine";

export interface PersonaDemo {
  nombre: string;
  /** Forma corta para listas y botones (apellido). */
  corto: string;
  /** Apodos o formas de trato documentadas (vacío si no hay certeza). */
  apodos: string[];
  alias: string[];
  nacimiento: string;
  muerte: string | null;
  descripcion: string;
}

export interface ParejaDemo {
  id: string;
  borges: PersonaDemo;
  bioy: PersonaDemo;
  inicioRelacion: string;
  inicioAproximado: boolean;
  relacion: string;
  ambito: AmbitoDemo;
  fechaEjemplo: string;
  escenaEjemplo: string;
  fuentes: { titulo: string; url: string }[];
}

const wiki = (titulo: string, slug: string) => ({
  titulo: `Wikipedia: ${titulo}`,
  url: `https://es.wikipedia.org/wiki/${slug}`,
});

export const PAREJAS_DEMO: ParejaDemo[] = [
  {
    id: "borges-bioy",
    borges: {
      nombre: "Jorge Luis Borges",
      corto: "Borges",
      apodos: ["Georgie"],
      alias: ["borges", "jorge luis borges"],
      nacimiento: "1899-08-24",
      muerte: "1986-06-14",
      descripcion: "escritor argentino",
    },
    bioy: {
      nombre: "Adolfo Bioy Casares",
      corto: "Bioy",
      apodos: ["Adolfito"],
      alias: ["bioy", "bioy casares", "adolfo bioy casares"],
      nacimiento: "1914-09-15",
      muerte: "1999-03-08",
      descripcion: "escritor argentino",
    },
    inicioRelacion: "1932",
    inicioAproximado: false,
    relacion:
      "Amigos íntimos y colaboradores literarios desde 1932; en este diario apócrifo cenan en el departamento de la calle Posadas en octubre de 2026 y comentan el Premio Nobel de Literatura concedido a Anne Carson.",
    ambito: "literatura",
    fechaEjemplo: "2026-10-08",
    escenaEjemplo: "Come en casa Borges",
    fuentes: [
      wiki("Jorge Luis Borges", "Jorge_Luis_Borges"),
      wiki("Adolfo Bioy Casares", "Adolfo_Bioy_Casares"),
      wiki("Anne Carson", "Anne_Carson"),
    ],
  },
  {
    id: "messi-scaloni",
    borges: {
      nombre: "Lionel Messi",
      corto: "Messi",
      apodos: ["Leo", "la Pulga"],
      alias: ["messi", "leo messi", "lionel messi", "lionel andrés messi"],
      nacimiento: "1987-06-24",
      muerte: null,
      descripcion: "futbolista argentino",
    },
    bioy: {
      nombre: "Lionel Scaloni",
      corto: "Scaloni",
      apodos: ["el Gringo"],
      alias: ["scaloni", "lionel scaloni"],
      nacimiento: "1978-05-16",
      muerte: null,
      descripcion: "entrenador de la selección argentina",
    },
    inicioRelacion: "2006",
    inicioAproximado: true,
    relacion:
      "Compañeros en la selección argentina en el Mundial 2006; desde 2018 Scaloni es su entrenador en la selección.",
    ambito: "fútbol",
    fechaEjemplo: "2022-12-16",
    escenaEjemplo: "Cena en la concentración",
    fuentes: [wiki("Lionel Messi", "Lionel_Messi"), wiki("Lionel Scaloni", "Lionel_Scaloni")],
  },
  {
    id: "milei-macri",
    borges: {
      nombre: "Javier Milei",
      corto: "Milei",
      apodos: ["el Peluca", "el León"],
      alias: ["milei", "javier milei", "javier gerardo milei"],
      nacimiento: "1970-10-22",
      muerte: null,
      descripcion: "presidente de la Nación Argentina",
    },
    bioy: {
      nombre: "Mauricio Macri",
      corto: "Macri",
      apodos: ["el Gato"],
      alias: ["macri", "mauricio macri"],
      nacimiento: "1959-02-08",
      muerte: null,
      descripcion: "expresidente de la Nación Argentina",
    },
    inicioRelacion: "2020",
    inicioAproximado: true,
    relacion:
      "Aliados políticos desde el pacto de Acassuso en 2023, con habituales cenas nocturnas de milanesas en la Quinta de Olivos durante 2024.",
    ambito: "política",
    fechaEjemplo: "2024-08-21",
    escenaEjemplo: "Cena en la Quinta de Olivos",
    fuentes: [wiki("Javier Milei", "Javier_Milei"), wiki("Mauricio Macri", "Mauricio_Macri")],
  },
  {
    id: "riquelme-delgado",
    borges: {
      nombre: "Juan Román Riquelme",
      corto: "Riquelme",
      apodos: ["Román"],
      alias: ["riquelme", "juan román riquelme", "juan roman riquelme", "román riquelme"],
      nacimiento: "1978-06-24",
      muerte: null,
      descripcion: "presidente e ídolo de Boca Juniors",
    },
    bioy: {
      nombre: "Marcelo Delgado",
      corto: "Delgado",
      apodos: ["el Chelo"],
      alias: ["delgado", "marcelo delgado", "chelo delgado", "el chelo delgado"],
      nacimiento: "1973-03-24",
      muerte: null,
      descripcion: "exdelantero e integrante del Consejo de Fútbol de Boca Juniors",
    },
    inicioRelacion: "2000-01",
    inicioAproximado: false,
    relacion:
      "Compañeros de ataque en el Boca multicampeón desde el año 2000, amigos íntimos y laderos en el Consejo de Fútbol del predio de Ezeiza durante el ciclo dirigencial de Riquelme.",
    ambito: "fútbol",
    fechaEjemplo: "2024-05-14",
    escenaEjemplo: "Asado nocturno en el predio de Ezeiza",
    fuentes: [
      wiki("Juan Román Riquelme", "Juan_Rom%C3%A1n_Riquelme"),
      wiki("Marcelo Delgado", "Marcelo_Delgado"),
    ],
  },
  {
    id: "garcia-paez",
    borges: {
      nombre: "Charly García",
      corto: "García",
      apodos: ["Charly"],
      alias: ["charly garcia", "charly garcía", "garcia", "garcía", "carlos alberto garcía moreno"],
      nacimiento: "1951-10-23",
      muerte: null,
      descripcion: "músico argentino",
    },
    bioy: {
      nombre: "Fito Páez",
      corto: "Páez",
      apodos: ["Fito"],
      alias: ["fito paez", "fito páez", "paez", "páez", "rodolfo páez", "rodolfo paez"],
      nacimiento: "1963-03-13",
      muerte: null,
      descripcion: "músico argentino",
    },
    inicioRelacion: "1983",
    inicioAproximado: false,
    relacion:
      "Fito Páez se incorporó a la banda de Charly García en 1983; en 1986 grabaron juntos el álbum La, la, la.",
    ambito: "música",
    fechaEjemplo: "1986-09-20",
    escenaEjemplo: "En el estudio, de madrugada",
    fuentes: [wiki("Charly García", "Charly_Garc%C3%ADa"), wiki("Fito Páez", "Fito_P%C3%A1ez")],
  },
  {
    id: "maradona-coppola",
    borges: {
      nombre: "Diego Maradona",
      corto: "Maradona",
      apodos: ["Diego", "el Pelusa"],
      alias: ["maradona", "diego maradona", "diego armando maradona"],
      nacimiento: "1960-10-30",
      muerte: "2020-11-25",
      descripcion: "futbolista argentino",
    },
    bioy: {
      nombre: "Guillermo Cóppola",
      corto: "Cóppola",
      apodos: ["Guillote"],
      alias: ["coppola", "cóppola", "guillermo coppola", "guillermo cóppola"],
      nacimiento: "1949-02-21",
      muerte: null,
      descripcion: "representante y amigo íntimo de Diego Maradona",
    },
    inicioRelacion: "1985",
    inicioAproximado: false,
    relacion:
      "Cóppola fue su representante y amigo inseparable desde 1985; en este diario apócrifo comparten en Doha y Buenos Aires las vísperas y los festejos de la final del Mundial de Qatar 2022.",
    ambito: "fútbol",
    fechaEjemplo: "2022-12-16",
    escenaEjemplo: "Come en casa Maradona, en Doha",
    fuentes: [wiki("Diego Maradona", "Diego_Maradona"), wiki("Guillermo Cóppola", "Guillermo_C%C3%B3ppola")],
  },
  {
    id: "bilardo-ruggeri",
    borges: {
      nombre: "Carlos Bilardo",
      corto: "Bilardo",
      apodos: ["el Narigón", "el Doctor"],
      alias: ["bilardo", "carlos bilardo", "carlos salvador bilardo"],
      nacimiento: "1938-03-16",
      muerte: null,
      descripcion: "entrenador de la selección argentina",
    },
    bioy: {
      nombre: "Oscar Ruggeri",
      corto: "Ruggeri",
      apodos: ["el Cabezón"],
      alias: ["ruggeri", "oscar ruggeri", "óscar ruggeri"],
      nacimiento: "1962-01-26",
      muerte: null,
      descripcion: "defensor de la selección argentina",
    },
    inicioRelacion: "1983",
    inicioAproximado: false,
    relacion:
      "Bilardo convocó a Ruggeri desde el inicio de su ciclo en la selección en 1983; ganaron el Mundial 1986 en México y fueron subcampeones en Italia 1990.",
    ambito: "fútbol",
    fechaEjemplo: "1986-06-25",
    escenaEjemplo: "Concentración del América en Ciudad de México",
    fuentes: [wiki("Carlos Bilardo", "Carlos_Bilardo"), wiki("Oscar Ruggeri", "Oscar_Ruggeri")],
  },
  {
    id: "solari-rocambole",
    borges: {
      nombre: "Indio Solari",
      corto: "Solari",
      apodos: ["el Indio"],
      alias: ["indio solari", "el indio solari", "carlos alberto solari", "solari"],
      nacimiento: "1949-01-17",
      muerte: null,
      descripcion: "músico argentino",
    },
    bioy: {
      nombre: "Rocambole",
      corto: "Rocambole",
      apodos: ["el Mono"],
      alias: ["rocambole", "ricardo cohen", "rocambole cohen", "josé ricardo cohen"],
      nacimiento: "1943-05-12",
      muerte: null,
      descripcion: "artista plástico argentino",
    },
    inicioRelacion: "1969",
    inicioAproximado: true,
    relacion:
      "Amigos desde La Cofradía de la Flor Solar en La Plata; Rocambole diseñó el arte de Patricio Rey y sus Redonditos de Ricota.",
    ambito: "música",
    fechaEjemplo: "1986-08-20",
    escenaEjemplo: "Taller de Rocambole en La Plata, con la tapa de Oktubre",
    fuentes: [wiki("Indio Solari", "Indio_Solari"), wiki("Ricardo Cohen", "Ricardo_Cohen")],
  },
  {
    id: "musk-trump",
    borges: {
      nombre: "Elon Musk",
      corto: "Musk",
      apodos: ["Elon"],
      alias: ["musk", "elon musk"],
      nacimiento: "1971-06-28",
      muerte: null,
      descripcion: "empresario sudafricano-estadounidense",
    },
    bioy: {
      nombre: "Donald Trump",
      corto: "Trump",
      apodos: ["Donald"],
      alias: ["trump", "donald trump", "donald j. trump"],
      nacimiento: "1946-06-14",
      muerte: null,
      descripcion: "presidente electo de los Estados Unidos",
    },
    inicioRelacion: "2016-12",
    inicioAproximado: false,
    relacion:
      "Trato directo desde diciembre de 2016; en 2024 Musk participó activamente en la campaña y se instaló en Mar-a-Lago durante la transición.",
    ambito: "política",
    fechaEjemplo: "2024-11-06",
    escenaEjemplo: "Cena en el patio de Mar-a-Lago",
    fuentes: [wiki("Elon Musk", "Elon_Musk"), wiki("Donald Trump", "Donald_Trump")],
  },
  {
    id: "scorsese-deniro",
    borges: {
      nombre: "Martin Scorsese",
      corto: "Scorsese",
      apodos: ["Marty"],
      alias: ["scorsese", "martin scorsese"],
      nacimiento: "1942-11-17",
      muerte: null,
      descripcion: "director de cine estadounidense",
    },
    bioy: {
      nombre: "Robert De Niro",
      corto: "De Niro",
      apodos: ["Bob", "Bobby"],
      alias: ["de niro", "robert de niro"],
      nacimiento: "1943-08-17",
      muerte: null,
      descripcion: "actor estadounidense",
    },
    inicioRelacion: "1972",
    inicioAproximado: true,
    relacion:
      "Amigos desde comienzos de los años setenta en Nueva York; filmaron juntos diez largometrajes entre Mean Streets (1973) y Killers of the Flower Moon (2023).",
    ambito: "cine",
    fechaEjemplo: "2023-05-19",
    escenaEjemplo: "Almuerzo en el hotel de Cannes antes del estreno",
    fuentes: [wiki("Martin Scorsese", "Martin_Scorsese"), wiki("Robert De Niro", "Robert_De_Niro")],
  },
];

export function listaParejasDemo(): string {
  return PAREJAS_DEMO.map((p) => `${p.borges.corto}/${p.bioy.corto}`).join(", ");
}
