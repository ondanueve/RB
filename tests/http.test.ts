import { describe, expect, it } from "vitest";
import { ErrorHTTP, conModelos, listaModelos, resumirError } from "../src/lib/providers/http";

describe("helpers de proveedores", () => {
  it("pasa al siguiente modelo solo ante 404/503", async () => {
    const vistos: string[] = [];
    const r = await conModelos("t1", ["a", "b", "c"], async (m) => {
      vistos.push(m);
      if (m === "a") throw new ErrorHTTP("retirado", 404);
      if (m === "b") throw new ErrorHTTP("saturado", 503);
      return m;
    });
    expect(r).toBe("c");
    expect(vistos).toEqual(["a", "b", "c"]);
  });

  it("no reintenta ante 429 (cuota)", async () => {
    const vistos: string[] = [];
    await expect(
      conModelos("t2", ["a", "b"], async (m) => {
        vistos.push(m);
        throw new ErrorHTTP("cuota", 429);
      }),
    ).rejects.toThrow(/cuota/);
    expect(vistos).toEqual(["a"]);
  });

  it("lee listas de modelos separadas por comas", () => {
    expect(listaModelos(" x , y ", ["z"])).toEqual(["x", "y"]);
    expect(listaModelos("", ["z"])).toEqual(["z"]);
  });

  it("resume errores de cuota de Google", () => {
    const t = JSON.stringify({
      error: {
        message: "You exceeded your current quota",
        details: [
          { "@type": "type.googleapis.com/google.rpc.QuotaFailure", violations: [{ quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier", quotaDimensions: { model: "m" } }] },
          { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "30s" },
        ],
      },
    });
    const r = resumirError(t);
    expect(r).toMatch(/FreeTier \[m\]/);
    expect(r).toMatch(/reintentar en 30s/);
  });
});

describe("conModelos y cuota por modelo", () => {
  it("pasa al siguiente modelo si se agotó la cuota diaria de ESE modelo, pero no ante una cuota general", async () => {
    const r = await conModelos("t-cuota", ["a", "b"], async (m) => {
      if (m === "a") throw new ErrorHTTP("HTTP 429 · cuota: GenerateRequestsPerDayPerProjectPerModel-FreeTier", 429);
      return m;
    });
    expect(r).toBe("b");
    await expect(
      conModelos("t-cuota2", ["a", "b"], async (m) => {
        if (m === "a") throw new ErrorHTTP("HTTP 429 · cuota: GenerateRequestsPerMinutePerProject", 429);
        return m;
      }),
    ).rejects.toThrow(/429/);
  });
});

describe("conModelos con timeout", () => {
  it("pasa al siguiente modelo si el actual no respondió a tiempo (504)", async () => {
    const vistos: string[] = [];
    const r = await conModelos("t-timeout", ["lento", "rapido"], async (m) => {
      vistos.push(m);
      if (m === "lento") throw new ErrorHTTP("timeout", 504);
      return m;
    });
    expect(r).toBe("rapido");
    expect(vistos).toEqual(["lento", "rapido"]);
  });
});

describe("conModelos: la cuota agotada gana sobre un 404 posterior", () => {
  it("si un modelo agotó su cuota y el último no existe, propaga el 429", async () => {
    const { conModelos, ErrorHTTP } = await import("../src/lib/providers/http");
    const err = await conModelos("prueba-cuota-404", ["a", "b"], async (m) => {
      if (m === "a") throw new ErrorHTTP("HTTP 429: cuota: GenerateRequestsPerDayPerProjectPerModel-FreeTier", 429);
      throw new ErrorHTTP("HTTP 404: no longer available", 404);
    }).catch((e) => e);
    expect(err.status).toBe(429);
  });
});
