import { describe, expect, it } from "vitest";
import { chequearFecha, encabezadoDeEntrada, rangoDeFechaParcial, fechaLarga } from "../src/lib/dates";

const borges = { nombre: "Jorge Luis Borges", nacimiento: "1899-08-24", muerte: "1986-06-14" };
const bioy = { nombre: "Adolfo Bioy Casares", nacimiento: "1914-09-15", muerte: "1999-03-08" };
const messi = { nombre: "Lionel Messi", nacimiento: "1987-06-24", muerte: null };
const scaloni = { nombre: "Lionel Scaloni", nacimiento: "1978-05-16", muerte: null };
const HOY = new Date("2026-10-18T12:00:00Z");

describe("encabezados", () => {
  it("calcula bien el día de la semana", () => {
    expect(encabezadoDeEntrada("2022-12-18")).toBe("Domingo, 18 de diciembre.");
    expect(encabezadoDeEntrada("1955-06-14")).toBe("Martes, 14 de junio.");
    expect(fechaLarga("1986-06-14")).toBe("14 de junio de 1986");
  });
  it("interpreta fechas parciales", () => {
    const [a, b] = rangoDeFechaParcial("1932")!;
    expect(a.toISOString().slice(0, 10)).toBe("1932-01-01");
    expect(b.toISOString().slice(0, 10)).toBe("1932-12-31");
    const [c, d] = rangoDeFechaParcial("2024-02")!;
    expect(c.toISOString().slice(0, 10)).toBe("2024-02-01");
    expect(d.toISOString().slice(0, 10)).toBe("2024-02-29");
    expect(rangoDeFechaParcial("hace mucho")).toBeNull();
  });
});

describe("chequeo de fecha", () => {
  it("acepta una fecha con ambos vivos y conocidos", () => {
    expect(chequearFecha("1960-05-10", borges, bioy, "1932", HOY).ok).toBe(true);
    expect(chequearFecha("2022-12-16", messi, scaloni, "2006", HOY).ok).toBe(true);
  });
  it("rechaza si todavía no se conocían", () => {
    const r = chequearFecha("1925-01-01", borges, bioy, "1932", HOY);
    expect(r.ok).toBe(false);
    expect(r.motivos.join(" ")).toMatch(/no se conocían/);
  });
  it("rechaza si uno ya había muerto", () => {
    const r = chequearFecha("1990-01-01", borges, bioy, "1932", HOY);
    expect(r.ok).toBe(false);
    expect(r.motivos.join(" ")).toMatch(/Borges ya había muerto/);
  });
  it("rechaza si uno no había nacido", () => {
    expect(chequearFecha("1980-01-01", messi, scaloni, null, HOY).ok).toBe(false);
  });
  it("rechaza fechas futuras", () => {
    const r = chequearFecha("2027-01-01", messi, scaloni, "2006", HOY);
    expect(r.ok).toBe(false);
    expect(r.motivos.join(" ")).toMatch(/futura/);
  });
  it("advierte (sin rechazar) en el año ambiguo del inicio de la relación", () => {
    const r = chequearFecha("2006-03-01", messi, scaloni, "2006", HOY);
    expect(r.ok).toBe(true);
    expect(r.advertencias.length).toBeGreaterThan(0);
  });
  it("acepta el mismo día de la muerte con fecha exacta", () => {
    expect(chequearFecha("1986-06-14", borges, bioy, "1932", HOY).ok).toBe(true);
  });
});
