import React from 'react';
import type { Entrada, EntradaDia } from '../lib/types';
import { bloquesDePagina } from '../lib/export/folio';
import { foliosDe } from '../lib/export/paginaSvg';
import { paginasDe, type NotaNumerada } from '../lib/paginas';

const MAPA_SUP: Record<string, string> = {
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
};

function renderConLlamadas(texto: string): React.ReactNode {
  const partes = texto.split(/([¹²³⁴⁵⁶⁷⁸⁹]|\[\d+\])/g);
  if (partes.length === 1) return texto;
  return partes.map((parte, idx) => {
    if (MAPA_SUP[parte]) {
      return (
        <sup key={idx} className="llamada-nota">
          {MAPA_SUP[parte]}
        </sup>
      );
    }
    const m = parte.match(/^\[(\d+)\]$/);
    if (m) {
      return (
        <sup key={idx} className="llamada-nota">
          {m[1]}
        </sup>
      );
    }
    return <React.Fragment key={idx}>{parte}</React.Fragment>;
  });
}

export function PaginaLibro({
  dias,
  notas,
  notasNumeradas,
  titulo,
  folio,
  lado,
}: {
  dias: EntradaDia[];
  notas: string[];
  notasNumeradas?: NotaNumerada[];
  titulo: string;
  folio: number;
  lado?: 'izquierda' | 'derecha';
}) {
  const listaNotas: NotaNumerada[] =
    notasNumeradas ?? notas.map((texto, i) => ({ numero: i + 1, texto }));

  return (
    <article
      className={`pagina-libro${lado ? ` ${lado}` : ''}`}
      aria-label={`Página ${folio} del diario`}
    >
      <div className="cornisa">{titulo}</div>
      {bloquesDePagina({ dias }).map((b, i) =>
        b.tipo === 'anio' ? (
          <div key={i} className="anio">
            {b.anio}
          </div>
        ) : (
          <section key={i} className="entrada-dia">
            <p className="fecha sin-sangria">
              <em>{b.encabezado}</em> {renderConLlamadas(b.situacion)}
            </p>
            {b.parrafos.map((p, j) => (
              <p key={j}>{renderConLlamadas(p)}</p>
            ))}
          </section>
        )
      )}
      {listaNotas.length > 0 && (
        <div className="notas">
          {listaNotas.map((n) => (
            <p key={n.numero}>
              <sup>{n.numero}</sup> {n.texto}
            </p>
          ))}
        </div>
      )}
      <div className="folio">{folio}</div>
      <div className="marca">Parodia · Ficción generada por IA</div>
    </article>
  );
}

export function LibroAbierto({
  entrada,
  titulo,
}: {
  entrada: Pick<Entrada, 'dias' | 'notas' | 'paginas'>;
  titulo: string;
}) {
  const pags = paginasDe(entrada);
  const folios = foliosDe(entrada, pags.length);
  const dos = pags.length > 1;
  return (
    <div className={`libro${dos ? ' dos' : ''}`}>
      {pags.map((pg, i) => (
        <PaginaLibro
          key={i}
          dias={pg.dias}
          notas={pg.notas}
          notasNumeradas={pg.notasNumeradas}
          titulo={titulo}
          folio={folios[i]}
          lado={dos ? (i === 0 ? 'izquierda' : 'derecha') : undefined}
        />
      ))}
    </div>
  );
}
