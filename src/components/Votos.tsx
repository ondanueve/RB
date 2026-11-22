import React, { useEffect, useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { enviarVoto, leerVotos, recordarVoto, votoLocal, type ConteoVotos, type Voto } from '../lib/votos';

/**
 * Me gusta / no me gusta de un diario guardado. Un voto por navegador: se puede cambiar o quitar
 * tocando de nuevo el mismo botón. Va fuera de la hoja (no aparece en capturas ni tarjetas).
 */
export function VotosDiario({ id }: { id: string }) {
  const [conteo, setConteo] = useState<ConteoVotos | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    setConteo(null);
    setAviso(null);
    const mio = votoLocal(id);
    leerVotos(id)
      .then((c) => {
        if (!vivo) return;
        setConteo(c);
        recordarVoto(id, c.mio);
      })
      .catch(() => vivo && setConteo({ likes: 0, dislikes: 0, mio }));
    return () => {
      vivo = false;
    };
  }, [id]);

  async function votar(v: 1 | -1) {
    if (!conteo || enviando) return;
    const previo = conteo;
    const nuevo: Voto = previo.mio === v ? 0 : v;
    // Respuesta inmediata; si el servidor no lo acepta, se vuelve atrás.
    setConteo({
      likes: previo.likes - (previo.mio === 1 ? 1 : 0) + (nuevo === 1 ? 1 : 0),
      dislikes: previo.dislikes - (previo.mio === -1 ? 1 : 0) + (nuevo === -1 ? 1 : 0),
      mio: nuevo,
    });
    setEnviando(true);
    setAviso(null);
    try {
      const c = await enviarVoto(id, nuevo);
      setConteo(c);
      recordarVoto(id, c.mio);
    } catch (e) {
      setConteo(previo);
      setAviso((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  const likes = conteo?.likes ?? 0;
  const dislikes = conteo?.dislikes ?? 0;
  const mio = conteo?.mio ?? 0;

  return (
    <div className="votos no-captura" role="group" aria-label="Votar este diario">
      <p className="votos-t" id={`votos-t-${id}`}>
        ¿Qué te pareció?
      </p>
      <div className="votos-botones">
        <button
          type="button"
          className="btn-voto"
          aria-pressed={mio === 1}
          aria-label={`Me gusta (${likes})`}
          title={mio === 1 ? 'Quitar mi me gusta' : 'Me gusta'}
          disabled={!conteo}
          onClick={() => votar(1)}
        >
          <ThumbsUp aria-hidden="true" />
          <span className="n tabular-nums" aria-hidden="true">
            {conteo ? likes : '·'}
          </span>
        </button>
        <button
          type="button"
          className="btn-voto"
          aria-pressed={mio === -1}
          aria-label={`No me gusta (${dislikes})`}
          title={mio === -1 ? 'Quitar mi no me gusta' : 'No me gusta'}
          disabled={!conteo}
          onClick={() => votar(-1)}
        >
          <ThumbsDown aria-hidden="true" />
          <span className="n tabular-nums" aria-hidden="true">
            {conteo ? dislikes : '·'}
          </span>
        </button>
      </div>
      <p className="votos-aviso" role="status" aria-live="polite">
        {aviso ?? (mio !== 0 ? 'Gracias. Tocá de nuevo para quitar tu voto.' : '')}
      </p>
    </div>
  );
}
