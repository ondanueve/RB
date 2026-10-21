/**
 * Página del libro compuesta tipográficamente como SVG (fiel al texto, sin IA),
 * para exportarla a PNG aunque no haya imagen generada o aunque el modelo deforme las letras.
 * Una página = 2 a 4 entradas; el año se imprime al principio y cuando cambia.
 * Con dos páginas (entrada.paginas) se arma un libro abierto: las dos lado a lado.
 */
import type { EntradaDia } from "../types";
import { paginasDe } from "../paginas";
import { bandaMarca, escaparXML as x } from "../providers/image/watermark";
import { bloquesDePagina, folioDe } from "./folio";

const W = 1000;
const H = 1500;
const MARGEN_X = 120;
const TOP_TEXTO = 210;
const LIMITE_INF = H - 150;

/** Ancho promedio de un carácter de Liberation Serif, en "em" (aprox., conservador). */
const EM_CHAR = 0.47;

type DiaMin = Pick<EntradaDia, "anio" | "encabezado" | "situacion" | "parrafos">;

function envolver(texto: string, maxChars: number): string[] {
  const out: string[] = [];
  let linea = "";
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    if (linea && (linea + " " + w).length > maxChars) {
      out.push(linea);
      linea = w;
    } else linea = linea ? `${linea} ${w}` : w;
  }
  if (linea) out.push(linea);
  return out;
}

type Renglon =
  | { tipo: "anio"; texto: string }
  | { tipo: "texto"; texto: string; sangria: boolean; cursiva?: string }
  | { tipo: "aire"; alto: number };

function componer(dias: DiaMin[], fs: number): Renglon[] {
  const ancho = W - MARGEN_X * 2;
  const maxChars = Math.floor(ancho / (fs * EM_CHAR));
  const sangriaChars = 3;
  const out: Renglon[] = [];
  bloquesDePagina({ dias }).forEach((b, i) => {
    if (b.tipo === "anio") {
      if (i > 0) out.push({ tipo: "aire", alto: 0.6 });
      out.push({ tipo: "anio", texto: b.anio });
      return;
    }
    if (out.length && out[out.length - 1].tipo !== "anio") out.push({ tipo: "aire", alto: 0.55 });
    // Línea de fecha + situación: el encabezado en cursiva, la situación en redonda.
    const cab = envolver(`${b.encabezado} ${b.situacion}`, maxChars);
    cab.forEach((l, j) =>
      out.push({ tipo: "texto", texto: l, sangria: false, cursiva: j === 0 && l.startsWith(b.encabezado) ? b.encabezado : undefined }),
    );
    for (const p of b.parrafos) {
      const ls = envolver(`${"x".repeat(sangriaChars)} ${p}`, maxChars);
      ls.forEach((l, j) => out.push({ tipo: "texto", texto: j === 0 ? l.slice(sangriaChars + 1) : l, sangria: j === 0 }));
    }
  });
  return out;
}

function alto(rs: Renglon[], lh: number): number {
  return rs.reduce((h, r) => h + (r.tipo === "aire" ? r.alto * lh : r.tipo === "anio" ? lh * 1.5 : lh), 0);
}

/** Folios de un libro abierto: la página izquierda es par y la derecha, la siguiente. */
export function foliosDe(entrada: { dias: DiaMin[] }, n: number): number[] {
  const base = folioDe(entrada);
  const par = n > 1 ? base - (base % 2) : base;
  return Array.from({ length: n }, (_, i) => par + i);
}

/** Todas las páginas del diario en una sola imagen (una, o dos enfrentadas). */
export function svgPaginaTipografica(entrada: { dias: DiaMin[]; notas: string[]; paginas?: number[] }, titulo: string): string {
  const pags = paginasDe(entrada as { dias: EntradaDia[]; notas: string[]; paginas?: number[] });
  const folios = foliosDe(entrada, pags.length);
  if (pags.length === 1) return svgUnaPagina(pags[0], titulo, folios[0]);
  const GAP = 24;
  const ancho = W * pags.length + GAP * (pags.length - 1);
  const hojas = pags
    .map((pg, i) => svgUnaPagina(pg, titulo, folios[i]).replace("<svg ", `<svg x="${i * (W + GAP)}" y="0" `))
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${H}" viewBox="0 0 ${ancho} ${H}">
<rect width="${ancho}" height="${H}" fill="#3b2f25"/>
${hojas}
</svg>`;
}

function svgUnaPagina(
  entrada: { dias: DiaMin[]; notas: string[]; notasNumeradas?: { numero: number; texto: string }[] },
  titulo: string,
  folio: number,
): string {
  const ancho = W - MARGEN_X * 2;

  // Elegir el cuerpo de letra más grande que entre en la página.
  let fs = 22;
  let rs: Renglon[] = [];
  let lh = 0;
  for (; fs >= 12; fs--) {
    lh = Math.round(fs * 1.45);
    rs = componer(entrada.dias, fs);
    if (TOP_TEXTO + alto(rs, lh) <= LIMITE_INF) break;
  }
  fs = Math.max(fs, 12);

  const out: string[] = [];
  let y = TOP_TEXTO;
  let cortado = false;
  for (const r of rs) {
    if (y > LIMITE_INF) { cortado = true; break; }
    if (r.tipo === "aire") { y += r.alto * lh; continue; }
    if (r.tipo === "anio") {
      y += lh * 0.25;
      out.push(`<text x="${W / 2}" y="${Math.round(y)}" text-anchor="middle" font-family="Liberation Serif, serif" font-weight="bold" font-size="${Math.round(fs * 1.15)}" letter-spacing="3" fill="#1d1a16">${x(r.texto)}</text>`);
      y += lh * 1.25;
      continue;
    }
    const xx = r.sangria ? MARGEN_X + Math.round(fs * 1.4) : MARGEN_X;
    const contenido = r.cursiva
      ? `<tspan font-style="italic">${x(r.cursiva)}</tspan>${x(r.texto.slice(r.cursiva.length))}`
      : x(r.texto);
    out.push(`<text x="${xx}" y="${Math.round(y)}" font-family="Liberation Serif, Georgia, serif" font-size="${fs}" fill="#1d1a16" xml:space="preserve">${contenido}</text>`);
    y += lh;
  }
  if (cortado) {
    out.push(`<text x="${W - MARGEN_X}" y="${LIMITE_INF + lh}" text-anchor="end" font-family="Liberation Serif, serif" font-size="${fs}" fill="#1d1a16">[…]</text>`);
  }

  // Notas al pie solo si sobra lugar.
  const notas: string[] = [];
  const listaNotas =
    entrada.notasNumeradas ?? entrada.notas.map((texto, i) => ({ numero: i + 1, texto }));
  if (!cortado && listaNotas.length) {
    const nfs = Math.max(11, Math.round(fs * 0.72));
    const nlh = Math.round(nfs * 1.4);
    const nl = listaNotas.flatMap((n) =>
      envolver(`${n.numero}. ${n.texto}`, Math.floor(ancho / (nfs * EM_CHAR))),
    );
    let ny = Math.max(y + lh, LIMITE_INF - nl.length * nlh + nlh);
    if (ny + (nl.length - 1) * nlh <= LIMITE_INF + nlh) {
      notas.push(`<line x1="${MARGEN_X}" y1="${ny - nlh}" x2="${MARGEN_X + 200}" y2="${ny - nlh}" stroke="#a89c84"/>`);
      for (const l of nl) {
        notas.push(`<text x="${MARGEN_X}" y="${ny}" font-family="Liberation Serif, serif" font-size="${nfs}" fill="#3b352c">${x(l)}</text>`);
        ny += nlh;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#f4ecdb"/>
<rect width="46" height="${H}" fill="#000" opacity="0.05"/>
<text x="${W / 2}" y="140" text-anchor="middle" font-family="Liberation Serif, serif" font-size="17" letter-spacing="5" fill="#6d6252">${x(titulo.toUpperCase())}</text>
${out.join("\n")}
${notas.join("\n")}
<text x="${W / 2}" y="${H - 85}" text-anchor="middle" font-family="Liberation Serif, serif" font-size="17" fill="#6d6252">${folio}</text>
${bandaMarca(W, H).svg}
</svg>`;
}
