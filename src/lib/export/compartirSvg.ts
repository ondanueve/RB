/**
 * Imagen para compartir (Open Graph, 1200×630) como SVG puro, sin dependencias:
 * franja de título + la primera página del diario (fragmento) + franja de marca.
 * La rasteriza el backend (resvg) para los crawlers y el navegador (canvas) para compartir el archivo.
 */
import type { EntradaDia } from "../types";
import { paginasDe, tituloDe } from "../paginas";
import { escaparXML as x } from "../providers/image/watermark";
import { MARCA, NOMBRE_SITIO } from "../sitio";

export const OG_W = 1200;
export const OG_H = 630;

function envolver(texto: string, maxChars: number, maxLineas: number): string[] {
  const out: string[] = [];
  let linea = "";
  const palabras = texto.split(/\s+/).filter(Boolean);
  for (let i = 0; i < palabras.length; i++) {
    const w = palabras[i];
    if (linea && (linea + " " + w).length > maxChars) {
      out.push(linea);
      linea = w;
      if (out.length === maxLineas) return cortar(out);
    } else linea = linea ? `${linea} ${w}` : w;
  }
  if (linea) out.push(linea);
  return out.length > maxLineas ? cortar(out.slice(0, maxLineas)) : out;
}
function cortar(ls: string[]): string[] {
  ls[ls.length - 1] = ls[ls.length - 1].replace(/[,;:.\s]+$/, "") + "…";
  return ls;
}

export interface DatosCompartir {
  /** Cornisa ("Messi"). */
  titulo: string;
  /** Para la franja de título: «Borges, según Bioy». */
  borges: string;
  bioy: string;
  entrada: { dias: Pick<EntradaDia, "anio" | "encabezado" | "situacion" | "parrafos">[]; notas?: string[]; paginas?: number[] };
}

export function svgCompartir(p: DatosCompartir): string {
  const sans = "Liberation Sans, sans-serif";
  const serif = "Liberation Serif, serif";
  const primera = paginasDe({ dias: p.entrada.dias as EntradaDia[], notas: p.entrada.notas ?? [], paginas: p.entrada.paginas })[0];

  // Franja de título
  const tituloLargo = envolver(`${p.borges}, según ${p.bioy}`, 52, 1)[0];
  const franja = [
    `<text x="56" y="62" font-family="${serif}" font-size="34" fill="#f4f1e8">${x(tituloLargo)}</text>`,
    `<text x="${OG_W - 56}" y="62" text-anchor="end" font-family="${serif}" font-style="italic" font-size="24" fill="#c9b98f">Diario apócrifo</text>`,
  ].join("\n");

  // Página (la primera del diario): cornisa, año y el comienzo de las entradas.
  const px = 56, py = 96, pw = OG_W - 112, ph = 440, fs = 25, lh = 33;
  const maxChars = Math.floor((pw - 120) / (fs * 0.46));
  const lineas: { t: string; enc?: string; sangria?: boolean; aire?: boolean }[] = [];
  const MAX = 10;
  for (const d of primera.dias) {
    if (lineas.length >= MAX - 1) break;
    if (lineas.length) lineas.push({ t: "", aire: true });
    const encab = envolver(`${d.encabezado} ${d.situacion}`, maxChars, 2);
    encab.forEach((l, i) => lineas.push({ t: l, enc: i === 0 ? d.encabezado : undefined }));
    for (const par of d.parrafos) {
      const disponibles = MAX - lineas.length;
      if (disponibles <= 0) break;
      envolver(par, maxChars - 2, disponibles).forEach((l, i) => lineas.push({ t: l, sangria: i === 0 }));
    }
  }
  let y = py + 118;
  const cuerpo: string[] = [];
  for (const l of lineas.slice(0, MAX)) {
    if (l.aire) { y += lh * 0.4; continue; }
    const xx = px + 60 + (l.sangria ? 30 : 0);
    if (l.enc && l.t.startsWith(l.enc)) {
      cuerpo.push(`<text x="${xx}" y="${Math.round(y)}" font-family="${serif}" font-size="${fs}" fill="#1d1a16" xml:space="preserve"><tspan font-style="italic">${x(l.enc)}</tspan>${x(l.t.slice(l.enc.length))}</text>`);
    } else cuerpo.push(`<text x="${xx}" y="${Math.round(y)}" font-family="${serif}" font-size="${fs}" fill="#1d1a16">${x(l.t)}</text>`);
    y += lh;
  }
  const pagina = [
    `<rect x="${px + 6}" y="${py + 10}" width="${pw}" height="${ph}" fill="#000" opacity="0.3"/>`,
    `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#fbf6ea"/>`,
    `<rect x="${px}" y="${py}" width="28" height="${ph}" fill="#000" opacity="0.05"/>`,
    `<text x="${px + pw / 2}" y="${py + 40}" text-anchor="middle" font-family="${serif}" font-size="16" letter-spacing="5" fill="#6d6252">${x(p.titulo.toUpperCase())}</text>`,
    `<text x="${px + pw / 2}" y="${py + 78}" text-anchor="middle" font-family="${serif}" font-weight="bold" font-size="24" fill="#1d1a16">${x(primera.dias[0]?.anio ?? "")}</text>`,
    ...cuerpo,
  ].join("\n");

  const banda = [
    `<rect x="0" y="${OG_H - 56}" width="${OG_W}" height="56" fill="#111111"/>`,
    `<text x="56" y="${OG_H - 20}" font-family="${sans}" font-size="24" fill="#f4f1e8">${x(MARCA)}</text>`,
    `<text x="${OG_W - 56}" y="${OG_H - 20}" text-anchor="end" font-family="${sans}" font-size="24" fill="#c9c2b3">${x(NOMBRE_SITIO)}</text>`,
  ].join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" viewBox="0 0 ${OG_W} ${OG_H}">
<rect width="${OG_W}" height="${OG_H}" fill="#2b2620"/>
${franja}
${pagina}
${banda}
</svg>`;
}

/** Datos para la imagen a partir de un resultado o una página guardada (también las viejas, con tapa). */
export function datosCompartir(p: {
  titulo?: string;
  edicion?: { titulo?: string };
  parametros: { borges: string; bioy: string };
  validacion?: { borges?: { nombre: string; apellido?: string }; bioy?: { nombre: string } };
  entrada: DatosCompartir["entrada"];
}): DatosCompartir {
  return {
    titulo: tituloDe(p),
    borges: p.validacion?.borges?.nombre || p.parametros.borges,
    bioy: p.validacion?.bioy?.nombre || p.parametros.bioy,
    entrada: p.entrada,
  };
}
