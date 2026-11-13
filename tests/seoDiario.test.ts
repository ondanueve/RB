import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  esDemo,
  extractoDiario,
  htmlDiario,
  jsonEnScript,
  metaDiario,
  sitemapXml,
  tituloDiario,
  urlDiario,
} from "../src/lib/seoDiario";
import type { PaginaPublica } from "../src/lib/storage/tipos";

const antologia: PaginaPublica[] = JSON.parse(
  readFileSync(new URL("../src/generated/antologia.json", import.meta.url), "utf8"),
);
const plantilla = readFileSync(new URL("../index.html", import.meta.url), "utf8").replace(
  '<div id="root"></div>',
  '<div id="root"><main>portada</main><div>x</div></div>',
);
const diario: PaginaPublica = { ...structuredClone(antologia[1]), id: "4ajoLVbLkreLyb" };

describe("vista previa por diario (/d/<id>/)", () => {
  it("usa /d/<id>/ para diarios guardados y ?id= para los de muestra", () => {
    expect(urlDiario("4ajoLVbLkreLyb")).toBe("https://ondanueve.github.io/RB/d/4ajoLVbLkreLyb/");
    expect(urlDiario("demo3borges")).toBe("https://ondanueve.github.io/RB/?id=demo3borges");
    expect(urlDiario("../../x")).toBe("https://ondanueve.github.io/RB/?id=..%2F..%2Fx");
    expect(esDemo("demo12borges")).toBe(true);
    expect(esDemo("zx5krj5Qiy")).toBe(false);
  });

  it("arma título, extracto corto e imagen propia", () => {
    const m = metaDiario(diario);
    expect(m.tituloCorto).toBe(tituloDiario(diario));
    expect(m.tituloCorto).toMatch(/, según .+: (una página|dos páginas) del diario apócrifo$/);
    expect(m.titulo.endsWith(" · rayo borgesdebioyizador")).toBe(true);
    expect(m.descripcion.length).toBeLessThanOrEqual(155);
    expect(m.url).toBe("https://ondanueve.github.io/RB/d/4ajoLVbLkreLyb/");
    expect(m.imagen).toBe("https://ondanueve.github.io/RB/d/4ajoLVbLkreLyb/og.png");
    expect(metaDiario(antologia[0]).imagen).toBe("https://ondanueve.github.io/RB/og.png");
    expect(extractoDiario(diario, 1000).length).toBeGreaterThan(155);
  });

  it("reemplaza los metadatos de la portada y sube las rutas relativas dos niveles", () => {
    const m = metaDiario(diario);
    const html = htmlDiario(plantilla, diario, "<p>DIARIO</p>", m);
    const attr = (re: RegExp) => re.exec(html)?.[1];
    expect(attr(/<link rel="canonical" href="([^"]*)"/)).toBe(m.url);
    expect(attr(/property="og:url" content="([^"]*)"/)).toBe(m.url);
    expect(attr(/property="og:type" content="([^"]*)"/)).toBe("article");
    expect(attr(/property="og:image" content="([^"]*)"/)).toBe(m.imagen);
    expect(attr(/name="twitter:image" content="([^"]*)"/)).toBe(m.imagen);
    expect(attr(/name="twitter:card" content="([^"]*)"/)).toBe("summary_large_image");
    expect(html).toContain(`<title>${m.titulo}</title>`);
    expect(html).not.toContain("og-messi.png");
    expect(html).not.toMatch(/content="https:\/\/ondanueve\.github\.io\/RB\/"/);
    expect(html).toContain('href="../../favicon.svg"');
    expect(html).toContain('window.__RB_BASE__="../../"');
    expect(html).toContain('<div id="root"><p>DIARIO</p></div>');
    expect(html).not.toContain("portada");
    const datos = /<script id="bdb-pagina" type="application\/json">([\s\S]*?)<\/script>/.exec(html)?.[1];
    expect(JSON.parse(datos!).id).toBe("4ajoLVbLkreLyb");
    expect(html).toContain('"@type":"CreativeWork"');
    expect(html).not.toContain('"@type": "FAQPage"');
  });

  it("escapa comillas y etiquetas en metadatos y datos incrustados", () => {
    const raro = structuredClone(diario);
    raro.parametros.borges = 'A "B" <script>';
    raro.validacion = undefined as unknown as PaginaPublica["validacion"];
    const html = htmlDiario(plantilla, raro, "", metaDiario(raro));
    expect(html).toContain("A &quot;B&quot; &lt;script&gt;");
    expect(html).not.toContain('A "B" <script>');
    expect(jsonEnScript({ x: "</script>" })).toBe('{"x":"\\u003c/script\\u003e"}');
  });

  it("genera un sitemap válido", () => {
    const xml = sitemapXml([
      { url: "https://ondanueve.github.io/RB/", lastmod: "2026-11-13", changefreq: "weekly", priority: "0.8" },
      { url: urlDiario("4ajoLVbLkreLyb"), lastmod: "2026-11-13", changefreq: "yearly", priority: "0.6" },
    ]);
    expect(xml).toContain("<loc>https://ondanueve.github.io/RB/d/4ajoLVbLkreLyb/</loc>");
    expect(xml).not.toContain("?id=");
  });
});
