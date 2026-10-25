/**
 * Marca visible "Parodia · Ficción generada por IA" sobre cualquier imagen.
 * Sin dependencias nativas: envuelve la imagen en un SVG con una franja de texto.
 */
import { MARCA_PARODIA } from "../../marca";

export function escaparXML(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Lee ancho/alto de un PNG o JPEG en base64 (si no puede, devuelve null). */
export function dimensiones(b64: string): { w: number; h: number } | null {
  const buf = Buffer.from(b64.slice(0, 200_000), "base64");
  // PNG: IHDR en bytes 16..24
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  // JPEG: buscar marcador SOFn
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}

/**
 * Franja canónica con la marca de parodia, para una imagen de w × h.
 * La franja es OPACA a propósito: así, superponerla dos veces (por ejemplo al exportar a
 * PNG, que siempre la vuelve a estampar) da exactamente los mismos píxeles.
 */
export function bandaMarca(w: number, h: number): { svg: string; alto: number } {
  const fs = Math.max(14, Math.round(w / 40));
  const pad = Math.round(fs * 0.6);
  const alto = fs + pad * 2;
  const svg =
    `<rect x="0" y="${h - alto}" width="${w}" height="${alto}" fill="#141414"/>` +
    `<text x="${w - pad}" y="${h - pad - Math.round(fs * 0.15)}" text-anchor="end" font-family="Liberation Sans, Helvetica, Arial, sans-serif" font-size="${fs}" fill="#ffffff">${escaparXML(MARCA_PARODIA)}</text>`;
  return { svg, alto };
}

/** Devuelve un data URL SVG con la imagen original y la marca de parodia visible. */
export function conMarca(b64: string, mime: string, fallback = { w: 1024, h: 1536 }): string {
  const { w, h } = dimensiones(b64) ?? fallback;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<image width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" href="data:${mime};base64,${b64}"/>
${bandaMarca(w, h).svg}
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
