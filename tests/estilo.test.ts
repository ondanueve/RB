import { describe, expect, it } from "vitest";
import { detectarProblemas, contarPalabras, presentaParticipantes } from "../src/lib/estilo";
import { fechasDePagina, finDeVentana } from "../src/lib/dates";

const o = {
  borges: { nombre: "Lionel Messi", apodos: ["Leo", "la Pulga"] },
  bioy: { nombre: "Lionel Scaloni", apodos: [] },
  palabras: [350, 450] as [number, number],
};

describe("chequeos de estilo", () => {
  it("detecta monólogos (citas de más de dos oraciones)", () => {
    const p = detectarProblemas([{ situacion: "Cena.", parrafos: ["Dice: «Uno. Dos. Tres. Cuatro»."] }], o);
    expect(p.join(" ")).toMatch(/Cita demasiado larga/);
  });

  it("detecta fórmulas repetidas", () => {
    const p = detectarProblemas([{ situacion: "Cena.", parrafos: ["Esa gente no sabe. Creen que sí. Mientras tanto, esa gente vota. Creen que ganan."] }], o);
    expect(p.join(" ")).toMatch(/esa gente/);
    expect(p.join(" ")).toMatch(/creen que/);
  });

  it("detecta palabras repetidas en las situaciones (p. ej. 'madrugada' dos veces)", () => {
    const p = detectarProblemas(
      [
        { situacion: "Madrugada en el estudio.", parrafos: ["Madrugada en el ensayo; llega tarde."] },
        { situacion: "Otra madrugada.", parrafos: ["Nada."] },
      ],
      o,
    );
    expect(p.filter((x) => /madrugada/.test(x)).length).toBeGreaterThanOrEqual(2);
  });

  it("detecta el apodo de 'Borges' usado como vocativo hacia el diarista", () => {
    const p = detectarProblemas([{ situacion: "Cena.", parrafos: ["Me dice: «Tranquilo, Leo. Ya está»."] }], o);
    expect(p.join(" ")).toMatch(/vocativo/);
  });

  it("detecta vocativos entre los dos en el diálogo (apodo, nombre o apellido)", () => {
    const o2 = { ...o, bioy: { nombre: "Lionel Scaloni", apodos: ["El Gringo"] } };
    const casos = [
      "«Gringo, ponelo al Fideo», me suelta.",
      "«Mirá eso, Scaloni. El fútbol es así».",
      "Me dice: «¡Leo!» y se ríe.",
      "«Ya está, Lionel», contesta.",
    ];
    for (const c of casos) {
      const p = detectarProblemas([{ situacion: "Cena.", parrafos: [c] }], o2);
      expect(p.join(" "), c).toMatch(/vocativo/);
    }
    // Sin vocativos: decir las cosas directamente no es problema.
    const ok = detectarProblemas([{ situacion: "Cena.", parrafos: ["«Ponelo a Di María», me suelta. «Ángel tiene esa zurda»."] }], o2);
    expect(ok.join(" ")).not.toMatch(/vocativo/);
  });

  it("detecta al 'Borges' nombrado en la narración por el nombre de pila o un apodo", () => {
    const mal = detectarProblemas([{ situacion: "Cena.", parrafos: ["Leo pela una mandarina. Después la Pulga se va a dormir."] }], o);
    expect(mal.filter((x) => /por el apellido/.test(x))).toHaveLength(2);
    // El apellido, el nombre completo, el verbo "leo" y las citas no cuentan.
    const bien = detectarProblemas(
      [{ situacion: "Cena.", parrafos: ["Messi pela una mandarina. Lionel Messi no habla. Yo leo el diario. «Leo todo», dice alguien de afuera."] }],
      o,
    );
    expect(bien.join(" ")).not.toMatch(/por el apellido/);
  });

  it("mide el largo por página cuando hay dos", () => {
    const corto = { situacion: "Cena.", parrafos: ["Breve."] };
    const largo = { situacion: "Otra.", parrafos: [Array.from({ length: 400 }, () => "palabra").join(" ")] };
    const p = detectarProblemas([largo, corto], { ...o, reparto: [1, 1] });
    expect(p.join(" ")).toMatch(/La página 2 tiene solo/);
    expect(p.join(" ")).not.toMatch(/La página 1 tiene solo/);
  });

  it("detecta páginas demasiado largas", () => {
    const largo = Array.from({ length: 600 }, () => "palabra").join(" ");
    expect(detectarProblemas([{ situacion: "Cena.", parrafos: [largo] }], o).join(" ")).toMatch(/máximo/);
    expect(contarPalabras([{ situacion: "Uno dos.", parrafos: ["tres cuatro"] }])).toBe(4);
  });
});

describe("fechas de la página", () => {
  it("empieza en la fecha pedida, en orden, dentro de la ventana", () => {
    const f = fechasDePagina(["2022-12-18", "basura", "2022-12-01", "2023-05-01"], "2022-12-16", 21, 3, 0);
    expect(f[0]).toBe("2022-12-16");
    expect(f).toContain("2022-12-18");
    expect(f).toHaveLength(3);
    expect([...f].sort()).toEqual(f);
    expect(f.every((x) => x >= "2022-12-16" && x <= "2023-01-06")).toBe(true);
  });

  it("si la ventana es de un solo día, devuelve una sola fecha", () => {
    expect(fechasDePagina([], "2000-01-01", 0, 4)).toEqual(["2000-01-01"]);
  });

  it("la ventana termina antes de una muerte", () => {
    const fin = finDeVentana("1986-06-10", { nombre: "B", nacimiento: "1899-08-24", muerte: "1986-06-14" }, { nombre: "Y", nacimiento: "1914" }, "1932", 21, new Date("2026-01-01"));
    expect(fin).toBe(4);
  });

  it("la apertura presenta a los participantes; un lugar solo no alcanza", () => {
    expect(presentaParticipantes("Come en casa Messi.", o)).toBe(true);
    expect(presentaParticipantes("Cena en un bodegón, con De Paul.", o)).toBe(true);
    expect(presentaParticipantes("En el vestuario, De Paul y yo.", o)).toBe(true);
    expect(presentaParticipantes("Almuerzo en el hotel de Cannes, a un día del estreno.", o)).toBe(false);
    expect(presentaParticipantes("Asado nocturno en la concentración.", o)).toBe(false);
  });
});
