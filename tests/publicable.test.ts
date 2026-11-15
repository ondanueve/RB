import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { paraPublicar } from "../src/lib/publicable";
import type { PaginaPublica } from "../src/lib/storage/tipos";

describe("paraPublicar", () => {
  it("quita los datos técnicos del backend y las notas técnicas de las fuentes", () => {
    const p = JSON.parse(readFileSync(new URL("../antologia/fuente/demo1.json", import.meta.url), "utf8")) as PaginaPublica;
    const limpio = paraPublicar(p);
    expect(limpio).not.toHaveProperty("proveedores");
    expect(limpio).not.toHaveProperty("advertencias");
    expect(JSON.stringify(limpio)).not.toMatch(/gemini|citada por el modelo|AI Studio/i);
    expect(limpio.entrada).toEqual(p.entrada);
    expect(p.proveedores.texto).toMatch(/^gemini:/); // el original no se modifica
  });

  it("los textos visibles del sitio no mencionan la IA", () => {
    for (const f of ["../index.html", "../src/App.tsx", "../src/components/PaginaLibro.tsx", "../src/components/Compartir.tsx", "../src/lib/sitio.ts", "../src/lib/marca.ts", "../scripts/og/marca.html", "../DISCLAIMER.md"]) {
      const s = readFileSync(new URL(f, import.meta.url), "utf8");
      expect(s, f).not.toMatch(/\bIA\b|inteligencia artificial|\bGemini\b|generada por/);
    }
  });
});
