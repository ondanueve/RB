import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ensamblarAntologia, type Correccion } from "../src/lib/antologia";
import { PAREJAS_DEMO } from "../src/lib/demo";
import { presentaParticipantes } from "../src/lib/estilo";
import type { PaginaPublica } from "../src/lib/storage/tipos";

const leer = (ruta: string) => JSON.parse(readFileSync(new URL(ruta, import.meta.url), "utf8"));
const guardada: PaginaPublica[] = leer("../src/generated/antologia.json");
const fuentes: PaginaPublica[] = PAREJAS_DEMO.map((_, i) => leer(`../antologia/fuente/demo${i + 1}.json`));
const correcciones: Correccion[] = leer("../antologia/correcciones.json");

describe("antología de demo (generada por el endpoint real, no por el mock)", () => {
  it("src/generated/antologia.json está al día con antologia/fuente (si falla: npm run antologia)", () => {
    expect(guardada).toEqual(JSON.parse(JSON.stringify(ensamblarAntologia(fuentes, correcciones))));
  });

  it("tiene una página por pareja de demo con ids estables", () => {
    expect(guardada.map((p) => p.id)).toEqual(PAREJAS_DEMO.map((_, i) => `demo${i + 1}borges`));
  });

  it("cada demo salió del proveedor real (Gemini) con los parámetros de su pareja", () => {
    guardada.forEach((p, i) => {
      const par = PAREJAS_DEMO[i];
      expect(p.proveedores.texto, p.id).toMatch(/^gemini:/);
      expect(p.parametros.borges).toBe(par.borges.nombre);
      expect(p.parametros.bioy).toBe(par.bioy.nombre);
      expect(p.parametros.fecha).toBe(par.fechaEjemplo);
      expect(p.parametros.escena).toBe(par.escenaEjemplo);
      expect(p.parametros.tema ?? undefined).toBe(par.temaEjemplo);
      expect((p.entrada.paginas ?? [p.entrada.dias.length]).reduce((a, b) => a + b, 0)).toBe(p.entrada.dias.length);
    });
  });

  it("cada entrada abre presentando la escena y a los participantes, como en el original", () => {
    for (const p of guardada) {
      const o = { borges: p.validacion.borges, bioy: p.validacion.bioy };
      for (const d of p.entrada.dias) {
        expect(d.situacion.trim().length, `${p.id} ${d.fecha}`).toBeGreaterThan(5);
        expect(presentaParticipantes(d.situacion, o), `${p.id} ${d.fecha}: «${d.situacion}»`).toBe(true);
        expect(d.parrafos.length, `${p.id} ${d.fecha}`).toBeGreaterThan(0);
      }
    }
  });

  it("no hay texto truncado ni marcadores sueltos", () => {
    for (const p of guardada) {
      const texto = p.entrada.dias.flatMap((d) => [d.situacion, ...d.parrafos]).join("\n");
      expect(texto, p.id).not.toMatch(/\{[A-Z]+\}|undefined|null|\s{3,}/);
      for (const d of p.entrada.dias) {
        for (const x of [d.situacion, ...d.parrafos]) expect(x.trim(), `${p.id} ${d.fecha}`).toMatch(/[.!?»…”)]$/);
      }
      const abiertas = (texto.match(/«/g) ?? []).length;
      expect((texto.match(/»/g) ?? []).length, `${p.id}: comillas desparejas`).toBe(abiertas);
    }
  });

  it("la página aclara que el diálogo es imaginario (parodia, ficción generada por IA)", () => {
    const libro = readFileSync(new URL("../src/components/PaginaLibro.tsx", import.meta.url), "utf8");
    expect(libro).toMatch(/Parodia · Ficción generada por IA/);
    const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
    expect(app).toMatch(/Diarios apócrifos/);
  });
});
