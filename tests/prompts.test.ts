import { describe, expect, it } from "vitest";
import { promptEntrada, promptRevision, promptValidacion } from "../src/prompts";
import { parsearParametros } from "../src/lib/schema";
import { repartir } from "../src/lib/pipeline";
import { paginasDe, repartoDe, tituloDe } from "../src/lib/paginas";
import type { Contexto, Validacion } from "../src/lib/types";

const persona = (nombre: string, apodos: string[], apellido?: string) => ({ nombre, apodos, apellido, conocido: true, nacimiento: null, muerte: null });
const v: Validacion = {
  aceptado: true, justificacion: "", relacion: "capitán y entrenador", inicioRelacion: "2005", inicioAproximado: false, ambito: "fútbol",
  borges: persona("Lionel Messi", ["Leo", "La Pulga"], "Messi"), bioy: persona("Lionel Scaloni", ["El Gringo"], "Scaloni"),
  noVerificados: [], fuentes: [], conBusquedaWeb: false,
};
const c: Contexto = { desde: "2022-12-16", hasta: "2023-01-20", resumen: "Mundial.", recientes: [], proximos: [], fechasSugeridas: [], criticadosSugeridos: [], alabadosSugeridos: [], fuentes: [], conBusquedaWeb: false };
const pr = parsearParametros({ borges: "Lionel Messi", bioy: "Lionel Scaloni", fecha: "2022-12-16" });
if (!pr.ok) throw new Error("parámetros");
const p = pr.data;
const fechas = ["2022-12-16", "2022-12-17", "2022-12-20", "2023-01-02", "2023-01-04"];

describe("prompts: trato y nombres", () => {
  it("la escritura prohíbe vocativos, pide el apellido en la narración y prohíbe apodos inventados", () => {
    const { system, user } = promptEntrada(p, v, c, fechas, [3, 2]);
    expect(system).toMatch(/Sin vocativos/);
    expect(system).toMatch(/SIEMPRE por el apellido: «Messi»/);
    expect(system).toMatch(/No inventes apodos/);
    expect(system).toMatch(/jamás como\s+vocativo/);
    expect(user).toMatch(/en la narración: «Messi»/);
  });


});

describe("prompts y reparto: dos páginas", () => {
  it("una sola llamada pide las dos páginas, con la segunda a continuación de la primera", () => {
    const { system, user } = promptEntrada(p, v, c, fechas, [3, 2]);
    expect(system).toMatch(/2 PÁGINAS SEGUIDAS/);
    expect(system).toMatch(/La página 2 continúa cronológicamente la 1/);
    expect(user).toMatch(/Página 1: 2022-12-16/);
    expect(user).toMatch(/Página 2: 2023-01-02/);
    expect(promptEntrada(p, v, c, fechas.slice(0, 3), [3]).system).toMatch(/UNA página impresa/);
  });

  it("sin tapa: los prompts no piden editorial, colección ni tomo", () => {
    const { system } = promptEntrada(p, v, c, fechas, [3, 2]);
    expect(system).not.toMatch(/editorial|colecci[oó]n|tomo/i);
  });


});
