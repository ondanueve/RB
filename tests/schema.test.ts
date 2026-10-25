import { describe, expect, it } from "vitest";
import { parsearParametros } from "../src/lib/schema";

describe("parámetros", () => {
  it("acepta los obligatorios y aplica defaults", () => {
    const r = parsearParametros({ borges: "Lionel Messi", bioy: "Lionel Scaloni", fecha: "2022-12-16" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.extension).toBe("media");
      expect(r.data.criticados).toEqual([]);
      expect(r.data.paginas).toBe(2);
      expect(r.data).not.toHaveProperty("edicion");
    }
  });

  it("exige borges, bioy y fecha", () => {
    const r = parsearParametros({});
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const campos = r.errores.map((e) => e.campo);
      expect(campos).toEqual(expect.arrayContaining(["borges", "bioy", "fecha"]));
    }
  });

  it("rechaza fechas inexistentes o mal formadas", () => {
    expect(parsearParametros({ borges: "A B", bioy: "C D", fecha: "2023-02-30" }).ok).toBe(false);
    expect(parsearParametros({ borges: "A B", bioy: "C D", fecha: "16/12/2022" }).ok).toBe(false);
  });

  it("rechaza que Borges y Bioy sean la misma persona", () => {
    const r = parsearParametros({ borges: "Lionel Messi", bioy: "lionel messi", fecha: "2022-12-16" });
    expect(r.ok).toBe(false);
  });

  it("rechaza nombres con URLs o código", () => {
    expect(parsearParametros({ borges: "<script>", bioy: "C D", fecha: "2022-12-16" }).ok).toBe(false);
    expect(parsearParametros({ borges: "http://x.com", bioy: "C D", fecha: "2022-12-16" }).ok).toBe(false);
  });

  it("convierte listas separadas por comas", () => {
    const r = parsearParametros({
      borges: "Jorge Luis Borges",
      bioy: "Adolfo Bioy Casares",
      fecha: "1960-05-10",
      criticados: "Fulano Pérez, Mengano Gómez",
      edicion: { anio: "2026" }, // campo viejo: se ignora
      paginas: "1",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.criticados).toEqual(["Fulano Pérez", "Mengano Gómez"]);
      expect(r.data.paginas).toBe(1);
      expect(r.data).not.toHaveProperty("edicion");
    }
  });

  it("valida la extensión", () => {
    expect(parsearParametros({ borges: "A B", bioy: "C D", fecha: "2022-12-16", extension: "eterna" }).ok).toBe(false);
  });
});
