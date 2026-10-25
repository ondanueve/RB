import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { construirAntologia } from "../src/lib/antologia";
import { PAREJAS_DEMO } from "../src/lib/demo";

describe("antología de demo precalculada", () => {
  it("src/generated/antologia.json está al día (si falla: npm run antologia)", async () => {
    const guardada = JSON.parse(readFileSync(new URL("../src/generated/antologia.json", import.meta.url), "utf8"));
    const fresca = JSON.parse(JSON.stringify(await construirAntologia()));
    expect(guardada).toEqual(fresca);
  });
  it("tiene una página por pareja de demo con ids estables", async () => {
    const guardada = JSON.parse(readFileSync(new URL("../src/generated/antologia.json", import.meta.url), "utf8"));
    expect(guardada.map((p: { id: string }) => p.id)).toEqual(PAREJAS_DEMO.map((_, i) => `demo${i + 1}borges`));
  });
});
