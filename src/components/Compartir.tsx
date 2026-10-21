import React, { useEffect, useState } from 'react';
import type { PaginaPublica } from '../lib/storage/tipos';
import { bajarBlob, svgAPng } from '../lib/export/browserPng';
import { datosCompartir, svgCompartir } from '../lib/export/compartirSvg';
import { svgPaginaTipografica } from '../lib/export/paginaSvg';
import { htmlPagina } from '../lib/export/html';
import { repartoDe, tituloDe } from '../lib/paginas';

export function textoCompartir(p: PaginaPublica): string {
  const dos = repartoDe(p.entrada).length > 1;
  return `${p.validacion?.borges?.nombre || p.parametros.borges}, según ${
    p.validacion?.bioy?.nombre || p.parametros.bioy
  }: ${dos ? 'dos páginas' : 'una página'} del diario apócrifo`;
}

export function textoPlanoDiario(p: PaginaPublica): string {
  const titulo = tituloDe(p);
  const lineas = p.entrada.dias.map(
    (d) => `${d.anio}\n${d.encabezado} ${d.situacion}\n${d.parrafos.join('\n')}`
  );
  const notas =
    p.entrada.notas.length > 0
      ? `\nNotas:\n${p.entrada.notas.map((n, i) => `[${i + 1}] ${n}`).join('\n')}`
      : '';
  return `${titulo.toUpperCase()}\n\n${lineas.join('\n\n')}${notas}\n\n— rayo borgesdebioyizador (Parodia · Ficción generada por IA)`;
}

export function BarraAccionesDiario({ pagina }: { pagina: PaginaPublica }) {
  const [copiadoLink, setCopiadoLink] = useState(false);
  const [copiadoTexto, setCopiadoTexto] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);
  const [puedeShareNativo, setPuedeShareNativo] = useState(false);

  const texto = textoCompartir(pagina);
  const titulo = tituloDe(pagina);
  const nPags = repartoDe(pagina.entrada).length;
  const shareUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(
    pagina.id
  )}`;

  useEffect(() => {
    setPuedeShareNativo(
      typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    );
  }, []);

  async function copiarAlPortapapeles(contenido: string, tipo: 'link' | 'texto') {
    try {
      await navigator.clipboard.writeText(contenido);
    } catch {
      const input = document.createElement('textarea');
      input.value = contenido;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    if (tipo === 'link') {
      setCopiadoLink(true);
      setTimeout(() => setCopiadoLink(false), 2000);
    } else {
      setCopiadoTexto(true);
      setTimeout(() => setCopiadoTexto(false), 2000);
    }
  }

  async function ejecutarDescarga(
    clave: string,
    generador: () => Promise<Blob>,
    nombreArchivo: string
  ) {
    setOcupado(clave);
    setErrorDescarga(null);
    try {
      const blob = await generador();
      bajarBlob(blob, nombreArchivo);
    } catch (e) {
      setErrorDescarga((e as Error).message);
    } finally {
      setOcupado(null);
    }
  }

  const waHref = `https://wa.me/?text=${encodeURIComponent(`${texto} ${shareUrl}`)}`;
  const xHref = `https://x.com/intent/post?text=${encodeURIComponent(
    texto
  )}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="space-y-3 my-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#fbf6ea]/85 border border-[#d4c5a6]">
        {/* Compartir y copiar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] text-[#5b5246] mr-1">Compartir:</span>
          {puedeShareNativo && (
            <button
              type="button"
              onClick={() =>
                navigator.share({ title: texto, text: texto, url: shareUrl }).catch(() => {})
              }
              className="px-3 py-1.5 text-[14px] bg-[#7a1f1f] text-[#fbf3e2] hover:bg-[#5e1616] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Compartir…
            </button>
          )}
          <button
            type="button"
            onClick={() => copiarAlPortapapeles(shareUrl, 'link')}
            className="px-3 py-1.5 text-[14px] border border-[#7a1f1f] text-[#7a1f1f] hover:bg-[#7a1f1f]/10 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {copiadoLink ? '¡Enlace copiado!' : 'Copiar link'}
          </button>
          <button
            type="button"
            onClick={() => copiarAlPortapapeles(textoPlanoDiario(pagina), 'texto')}
            className="px-3 py-1.5 text-[14px] border border-[#7a1f1f] text-[#7a1f1f] hover:bg-[#7a1f1f]/10 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {copiadoTexto ? '¡Texto copiado!' : 'Copiar texto'}
          </button>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer noopener"
            className="px-3 py-1.5 text-[14px] border border-[#7a1f1f] text-[#7a1f1f] hover:bg-[#7a1f1f]/10 transition-colors no-underline whitespace-nowrap shrink-0"
          >
            WhatsApp
          </a>
          <a
            href={xHref}
            target="_blank"
            rel="noreferrer noopener"
            className="px-3 py-1.5 text-[14px] border border-[#7a1f1f] text-[#7a1f1f] hover:bg-[#7a1f1f]/10 transition-colors no-underline whitespace-nowrap shrink-0"
          >
            Publicar en X
          </a>
        </div>

        {/* Descargas tipográficas */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] text-[#5b5246] mr-1">Descargar edición:</span>
          <button
            type="button"
            disabled={Boolean(ocupado)}
            onClick={() =>
              ejecutarDescarga(
                'pagina',
                () => svgAPng(svgPaginaTipografica(pagina.entrada, titulo)),
                `borgesdebioyizador-${pagina.id}.png`
              )
            }
            className="px-3 py-1.5 text-[14px] bg-[#7a1f1f] text-[#fbf3e2] hover:bg-[#5e1616] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {ocupado === 'pagina'
              ? 'Componiendo PNG…'
              : nPags > 1
              ? 'Páginas PNG (Libro abierto)'
              : 'Página PNG'}
          </button>
          <button
            type="button"
            disabled={Boolean(ocupado)}
            onClick={() =>
              ejecutarDescarga(
                'og',
                () => svgAPng(svgCompartir(datosCompartir(pagina))),
                `borgesdebioyizador-${pagina.id}-tarjeta.png`
              )
            }
            className="px-3 py-1.5 text-[14px] border border-[#7a1f1f] text-[#7a1f1f] hover:bg-[#7a1f1f]/10 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {ocupado === 'og' ? 'Generando…' : 'Tarjeta redes (1200×630)'}
          </button>
          <button
            type="button"
            onClick={() =>
              bajarBlob(
                new Blob([htmlPagina(pagina.entrada, titulo)], {
                  type: 'text/html;charset=utf-8',
                }),
                `borgesdebioyizador-${pagina.id}.html`
              )
            }
            className="px-3 py-1.5 text-[14px] border border-[#7a1f1f] text-[#7a1f1f] hover:bg-[#7a1f1f]/10 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {nPags > 1 ? 'Páginas HTML' : 'Página HTML'}
          </button>
        </div>
      </div>

      {errorDescarga && (
        <div className="p-3 bg-[#7a1f1f]/10 border border-[#7a1f1f] text-[15px] text-[#7a1f1f]">
          {errorDescarga}
        </div>
      )}
    </div>
  );
}
