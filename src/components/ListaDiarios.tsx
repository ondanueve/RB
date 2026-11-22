import React, { useEffect, useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { listarDiarios, type DiarioListado, type Orden } from '../lib/votos';
import { MARCA } from '../lib/sitio';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const POR_TANDA = 12;

function fecha(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/** «Borges, según Bioy: dos páginas apócrifas del diario» → «Borges, según Bioy». */
function nombres(titulo: string): string {
  return titulo.replace(/:\s*(dos páginas apócrifas|una página apócrifa) del diario$/, '');
}

function extracto(descripcion: string): string {
  return descripcion.replace(new RegExp(`(…\\s*)?·\\s*${MARCA.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '').trim();
}

/** Diarios que escribió el público, por votos o por fecha. */
export function ListaDiarios({ urlDe }: { urlDe: (id: string) => string }) {
  const [orden, setOrden] = useState<Orden>('votos');
  const [diarios, setDiarios] = useState<DiarioListado[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibles, setVisibles] = useState(POR_TANDA);

  useEffect(() => {
    let vivo = true;
    setError(null);
    listarDiarios(orden)
      .then((d) => vivo && setDiarios(d))
      .catch((e) => vivo && setError((e as Error).message));
    return () => {
      vivo = false;
    };
  }, [orden]);

  function cambiar(o: Orden) {
    if (o === orden) return;
    setOrden(o);
    setVisibles(POR_TANDA);
  }

  return (
    <section id="diarios" className="seccion diarios-zona" aria-labelledby="titulo-diarios">
      <div className="seccion-cab">
        <h2 id="titulo-diarios">Diarios del público</h2>
        <p>Los que escribieron otros visitantes. Votá los que te gusten para que suban.</p>
      </div>

      <div className="orden-diarios" role="group" aria-label="Ordenar diarios">
        <button type="button" aria-pressed={orden === 'votos'} onClick={() => cambiar('votos')}>
          Más votados
        </button>
        <button type="button" aria-pressed={orden === 'recientes'} onClick={() => cambiar('recientes')}>
          Recientes
        </button>
      </div>

      {error && (
        <p className="diarios-estado" role="alert">
          {error}
        </p>
      )}
      {!error && !diarios && (
        <p className="diarios-estado" role="status">
          Buscando en el cuaderno…
        </p>
      )}

      {diarios && (
        <>
          <ol className="lista-diarios" aria-busy={false}>
            {diarios.slice(0, visibles).map((d) => (
              <li key={d.id}>
                <a href={urlDe(d.id)} className="tarjeta-diario">
                  <span className="t">{nombres(d.titulo)}</span>
                  <span className="ext">{extracto(d.descripcion)}</span>
                  <span className="meta">
                    <span className="tabular-nums">{fecha(d.creada)}</span>
                    <span className="cuenta" aria-label={`${d.likes} me gusta, ${d.dislikes} no me gusta`}>
                      <span>
                        <ThumbsUp aria-hidden="true" /> <span className="tabular-nums">{d.likes}</span>
                      </span>
                      <span>
                        <ThumbsDown aria-hidden="true" /> <span className="tabular-nums">{d.dislikes}</span>
                      </span>
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
          {visibles < diarios.length && (
            <div className="diarios-mas">
              <button type="button" className="btn-ac" onClick={() => setVisibles((n) => n + POR_TANDA)}>
                Ver más diarios
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
