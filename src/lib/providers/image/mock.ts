/**
 * Imagen MOCK: SVG ilustrativo de la página, generado en el servidor, sin red.
 * Diseño propio y genérico; sin logos de nadie.
 */
import type { ImageProvider, ImageRequest } from "../types";
import { bandaMarca, escaparXML as x } from "./watermark";

function envolver(texto: string, max: number): string[] {
  const out: string[] = [];
  let linea = "";
  for (const w of texto.split(/\s+/)) {
    if ((linea + " " + w).trim().length > max) {
      out.push(linea.trim());
      linea = w;
    } else linea += " " + w;
  }
  if (linea.trim()) out.push(linea.trim());
  return out;
}

/** Leyenda de vista previa (encima de la franja canónica de la marca). */
const DEMO = `<text x="785" y="1143" text-anchor="end" font-family="Liberation Sans, Helvetica, Arial, sans-serif" font-size="14" fill="#9a9a9a">vista previa (modo demo)</text>`;

function svgPagina(req: ImageRequest): string {
  const { entrada: en, titulo } = req.meta;
  const primera = en.dias[0];
  const lineas = en.dias
    .flatMap((d, i) => [...(i ? [""] : []), ...envolver([i ? `${d.encabezado} ${d.situacion}` : d.situacion, ...d.parrafos].join(" "), 62)])
    .slice(0, 30);
  const cuerpo = lineas
    .map((l, i) => `<text x="110" y="${300 + i * 26}" font-family="Liberation Serif, Georgia, 'Times New Roman', serif" font-size="19" fill="#222">${x(l)}</text>`)
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
<rect width="800" height="1200" fill="#3b2f25"/>
<rect x="40" y="40" width="720" height="1120" fill="#f3ead8"/>
<rect x="40" y="40" width="40" height="1120" fill="#000" opacity="0.06"/>
<text x="400" y="110" text-anchor="middle" font-family="Liberation Serif, Georgia, serif" font-size="16" letter-spacing="4" fill="#555">${x(titulo.toUpperCase())}</text>
<text x="110" y="200" font-family="Liberation Serif, Georgia, serif" font-weight="bold" font-size="24" fill="#111">${x(primera.anio)}</text>
<text x="110" y="250" font-family="Liberation Serif, Georgia, serif" font-style="italic" font-size="21" fill="#111">${x(primera.encabezado)}</text>
${cuerpo}
<text x="400" y="1130" text-anchor="middle" font-family="Liberation Serif, Georgia, serif" font-size="16" fill="#555">${(Math.abs(primera.encabezado.length * 37) % 900) + 100}</text>
${DEMO}
${bandaMarca(800, 1200).svg}
</svg>`;
}

export function mockImage(): ImageProvider {
  return {
    nombre: "mock",
    async generar(req) {
      const svg = svgPagina(req);
      return { dataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}` };
    },
  };
}
