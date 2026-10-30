import React, { useEffect, useState } from 'react';
import type { PaginaPublica } from '../lib/storage/tipos';
import { bajarBlob, svgAPng } from '../lib/export/browserPng';
import { datosCompartir, svgCompartir } from '../lib/export/compartirSvg';
import { svgPaginaTipografica } from '../lib/export/paginaSvg';
import { htmlPagina } from '../lib/export/html';
import { repartoDe, tituloDe } from '../lib/paginas';
import { SITIO_POR_DEFECTO } from '../lib/sitio';

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
  // URL base canónica en el prerender (sin window); la real del navegador después de hidratar.
  const [baseUrl, setBaseUrl] = useState(`${SITIO_POR_DEFECTO}/`);
  const shareUrl = `${baseUrl}?id=${encodeURIComponent(pagina.id)}`;

  useEffect(() => {
    setBaseUrl(`${window.location.origin}${window.location.pathname}`);
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
    <div className="acciones" role="group" aria-label="Compartir y descargar este diario">
      <div className="grupo">
        <p className="grupo-t">Compartir</p>
        <div className="botones">
          {puedeShareNativo && (
            <button
              type="button"
              onClick={() =>
                navigator.share({ title: texto, text: texto, url: shareUrl }).catch(() => {})
              }
              className="btn-ac llena"
            >
              Compartir…
            </button>
          )}
          <button type="button" onClick={() => copiarAlPortapapeles(shareUrl, 'link')} className="btn-ac">
            {copiadoLink ? '¡Enlace copiado!' : 'Copiar link'}
          </button>
          <button
            type="button"
            onClick={() => copiarAlPortapapeles(textoPlanoDiario(pagina), 'texto')}
            className="btn-ac"
          >
            {copiadoTexto ? '¡Texto copiado!' : 'Copiar texto'}
          </button>
          <a href={waHref} target="_blank" rel="noreferrer noopener" className="btn-ac">
            WhatsApp
          </a>
          <a href={xHref} target="_blank" rel="noreferrer noopener" className="btn-ac">
            Publicar en X
          </a>
        </div>
      </div>

      <div className="grupo">
        <p className="grupo-t">Descargar edición</p>
        <div className="botones">
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
            className="btn-ac llena ancho"
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
            className="btn-ac"
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
            className="btn-ac"
          >
            {nPags > 1 ? 'Páginas HTML' : 'Página HTML'}
          </button>
        </div>
      </div>

      {errorDescarga && (
        <div className="aviso" role="alert" style={{ gridColumn: '1 / -1', margin: 0 }}>
          {errorDescarga}
        </div>
      )}
    </div>
  );
}
