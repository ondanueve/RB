/**
 * Páginas del libro (una, o dos enfrentadas) como archivo HTML autónomo, con la marca de parodia.
 * Funciona en el navegador y en el servidor (no usa APIs de Node).
 */
import type { Entrada } from "../types";
import { paginasDe } from "../paginas";
import { foliosDe } from "./paginaSvg";
import { MARCA_PARODIA } from "../../prompts";
import { bloquesDePagina } from "./folio";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function hoja(
  pag: { dias: Entrada["dias"]; notas: string[]; notasNumeradas?: { numero: number; texto: string }[] },
  titulo: string,
  folio: number,
): string {
  const listaNotas =
    pag.notasNumeradas ?? pag.notas.map((texto, i) => ({ numero: i + 1, texto }));
  const notas = listaNotas.length
    ? `<div class="notas">${listaNotas.map((n) => `<p><sup>${n.numero}</sup> ${esc(n.texto)}</p>`).join("")}</div>`
    : "";
  return `<article class="pagina">
<div class="cornisa">${esc(titulo)}</div>
${bloquesDePagina(pag)
  .map((b) =>
    b.tipo === "anio"
      ? `<div class="anio">${esc(b.anio)}</div>`
      : `<section class="dia"><p class="fecha"><em>${esc(b.encabezado)}</em> ${esc(b.situacion)}</p>\n${b.parrafos.map((p) => `<p>${esc(p)}</p>`).join("\n")}</section>`,
  )
  .join("\n")}
${notas}
<div class="folio">${folio}</div>
<div class="marca">${esc(MARCA_PARODIA)}</div>
</article>`;
}

export function htmlPagina(entrada: Pick<Entrada, "dias" | "notas" | "paginas">, titulo: string): string {
  const pags = paginasDe(entrada);
  const folios = foliosDe(entrada, pags.length);
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} · ${esc(entrada.dias[0]?.anio ?? "")} · ${esc(MARCA_PARODIA)}</title>
<!-- ${esc(MARCA_PARODIA)}. Texto original generado; no reproduce ninguna obra. Personas reales en situaciones ficticias. -->
<style>
  body { background: #3b2f25; margin: 0; padding: 2rem 1rem; font-family: "Liberation Serif", Georgia, "Times New Roman", serif; }
  .libro { display: flex; gap: 1.5rem; justify-content: center; align-items: flex-start; flex-wrap: wrap; }
  .pagina { position: relative; flex: 1 1 26rem; max-width: 34rem; margin: 0; background: #f4ecdb; color: #1d1a16;
            padding: 3rem 3rem 4.5rem; line-height: 1.5; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
  .cornisa { text-align: center; font-variant: small-caps; letter-spacing: .25em; font-size: .78rem; color: #6d6252; margin-bottom: 1.8rem; }
  .anio { font-weight: 600; text-align: center; font-size: 1.05rem; letter-spacing: .1em; margin: 0 0 .9rem; }
  p { margin: 0; text-indent: 1.4em; }
  p.fecha { text-indent: 0; }
  .dia { margin: 0 0 .9rem; }
  .dia + .anio { margin-top: 1.2rem; }
  .notas { margin-top: 1rem; border-top: 1px solid #bfb39b; padding-top: .3rem; }
  .notas p { font-size: .75rem; text-indent: 0; }
  .folio { position: absolute; bottom: 2rem; left: 0; right: 0; text-align: center; font-size: .8rem; color: #6d6252; }
  .marca { position: absolute; bottom: 0; left: 0; right: 0; background: #141414; color: #fff; text-align: right;
           font: 12px/1 "Liberation Sans", Helvetica, Arial, sans-serif; padding: .45rem .7rem; }
</style>
</head>
<body>
<div class="libro">
${pags.map((pg, i) => hoja(pg, titulo, folios[i])).join("\n")}
</div>
</body>
</html>
`;
}
