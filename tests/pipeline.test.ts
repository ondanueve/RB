import { partir } from "../src/lib/paginas";
import { contarPalabras } from "../src/lib/estilo";
import { describe, expect, it } from "vitest";
import { generar } from "../src/lib/pipeline";
import { situacionPara } from "../src/lib/providers/text/mock";
import { textProvider, imageProvider } from "../src/lib/providers";
import { MARCA_PARODIA } from "../src/prompts";

const env = { TEXT_PROVIDER: "mock", IMAGE_PROVIDER: "mock" };
const hoy = new Date("2026-10-18T12:00:00Z");

describe("pipeline en modo mock", () => {

  it("es determinístico", async () => {
    const azar = () => 0.42;
    const a = await generar({ borges: "Charly García", bioy: "Fito Páez", fecha: "1986-09-20" }, { env, hoy, azar });
    const b = await generar({ borges: "Charly García", bioy: "Fito Páez", fecha: "1986-09-20" }, { env, hoy, azar });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("acepta los roles invertidos", async () => {
    const r = await generar({ borges: "Scaloni", bioy: "Messi", fecha: "2022-12-16" }, { env, hoy });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.validacion.borges.nombre).toBe("Lionel Scaloni");
  });



  it("rechaza parámetros inválidos", async () => {
    const r = await generar({ borges: "Messi" }, { env, hoy });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.etapa).toBe("parametros");
  });


  it("funciona sin imágenes (IMAGE_PROVIDER=none)", async () => {
    const r = await generar({ borges: "Messi", bioy: "Scaloni", fecha: "2022-12-16" }, { env: { TEXT_PROVIDER: "mock", IMAGE_PROVIDER: "none" }, hoy });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.imagenes.pagina).toBeNull();
  });
});

describe("escenas y proveedores", () => {
  it("adapta la línea situacional a la escena (no siempre 'Come en casa.')", () => {
    expect(situacionPara("Vestuario post-partido")).toBe("En el vestuario, después del partido.");
    expect(situacionPara("Llamada telefónica pre-torneo")).toBe("Llama por teléfono, tarde.");
    expect(situacionPara("Cena en casa")).toBe("Come en casa.");
    expect(situacionPara("En un ascensor")).toBe("En un ascensor.");
  });
});

describe("parejas de demo", () => {



  it("los textos de demo no citan la obra real (solo plantillas propias)", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("src/lib/providers/text/mock.ts", "utf8");
    expect(src).not.toMatch(/Destino|Emecé/);
  });
});

describe("página de varias entradas", () => {
  it("sortea 2 a 4 entradas si no se fija la cantidad", async () => {
    const vistos = new Set<number>();
    for (const x of [0, 0.4, 0.99]) {
      const r = await generar({ borges: "Messi", bioy: "Scaloni", fecha: "2022-12-16", paginas: 1 }, { env, hoy, azar: () => x });
      if (r.ok) vistos.add(r.entrada.dias.length);
      const r2 = await generar({ borges: "Messi", bioy: "Scaloni", fecha: "2022-12-16" }, { env, hoy, azar: () => x });
      if (r2.ok) {
        expect(r2.entrada.paginas).toHaveLength(2);
        for (const k of r2.entrada.paginas!) expect(k >= 2 && k <= 4).toBe(true);
        // La segunda página sigue en el tiempo a la primera.
        const [a, b] = partir(r2.fechas, r2.entrada.paginas!);
        expect(a[a.length - 1] < b[0]).toBe(true);
      }
    }
    expect([...vistos].sort()).toEqual([2, 3, 4]);
  });

  it("valida el parámetro entradas", async () => {
    const r = await generar({ borges: "Messi", bioy: "Scaloni", fecha: "2022-12-16", entradas: 7 }, { env, hoy });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.etapa).toBe("parametros");
  });



});
