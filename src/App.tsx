import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, ChevronDown, ChevronUp } from 'lucide-react';
import { ESCENAS_SUGERIDAS, TONOS } from './lib/opciones';
import { PAREJAS_DEMO } from './lib/demo';
import type { ResultadoRechazo } from './lib/types';
import type { PaginaPublica } from './lib/storage/tipos';

/** Páginas de demo precalculadas en build (scripts/antologia.ts): el navegador no carga el pipeline. */
const ANTOLOGIA_INICIAL = ANTOLOGIA_DEMO as unknown as PaginaPublica[];
import { MARCA, NOMBRE_SITIO, REPOSITORIO_GITHUB, SUPABASE_FUNCTIONS_API } from './lib/sitio';
import { tituloDe } from './lib/paginas';
import ANTOLOGIA_DEMO from './generated/antologia.json';
import { LibroAbierto } from './components/PaginaLibro';
import { BarraAccionesDiario, textoCompartir } from './components/Compartir';
import { sincronizarSeoPagina } from './lib/seoHead';
import { BotonTema } from './components/BotonTema';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
/** «2026-10-07» → «7 oct 2026» (sin Intl, para que el prerender y el cliente coincidan). */
function fechaCorta(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MESES[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

/** Con un enlace ?id=… el visitante viene por esa entrada: bajar hasta ella tras renderizarla. */
function irAlLibro() {
  setTimeout(() => document.getElementById('libro')?.scrollIntoView({ behavior: 'auto' }), 80);
}

export default function App() {
  // Form state (default: Borges / Bioy, index 0)
  const [borges, setBorges] = useState<string>(PAREJAS_DEMO[0].borges.nombre);
  const [bioy, setBioy] = useState<string>(PAREJAS_DEMO[0].bioy.nombre);
  const [fecha, setFecha] = useState<string>(PAREJAS_DEMO[0].fechaEjemplo);
  const [escena, setEscena] = useState<string>(PAREJAS_DEMO[0].escenaEjemplo);
  const [criticados, setCriticados] = useState<string>('');
  const [alabados, setAlabados] = useState<string>('');
  const [presentes, setPresentes] = useState<string>('');
  const [tema, setTema] = useState<string>(PAREJAS_DEMO[0].temaEjemplo ?? '');
  const [tono, setTono] = useState<string>('irónico');
  const [mostrarOptativos, setMostrarOptativos] = useState<boolean>(false);

  // Anthology & Active Book Page state
  const [antologia, setAntologia] = useState<PaginaPublica[]>(ANTOLOGIA_INICIAL);
  const [paginaActiva, setPaginaActiva] = useState<PaginaPublica | null>(ANTOLOGIA_INICIAL[0] ?? null);
  const [indiceDemoActivo, setIndiceDemoActivo] = useState<number>(0);

  // Generation status
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rechazo, setRechazo] = useState<ResultadoRechazo | null>(null);

  // Load initial anthology immediately and check if URL has ?id=...
  useEffect(() => {
    async function inicializar() {
      const locales = ANTOLOGIA_INICIAL;

      const params = new URLSearchParams(window.location.search);
      const idParam = params.get('id');
      if (idParam) {
        const idxLocal = locales.findIndex((x) => x.id === idParam);
        if (idxLocal >= 0) {
          const encontrada = locales[idxLocal];
          setIndiceDemoActivo(idxLocal);
          setBorges(encontrada.parametros.borges);
          setBioy(encontrada.parametros.bioy);
          setFecha(encontrada.parametros.fecha);
          setEscena(encontrada.parametros.escena ?? '');
          setTema(encontrada.parametros.tema ?? '');
          setPaginaActiva(encontrada);
          sincronizarSeoPagina(encontrada);
          irAlLibro();
          return;
        }
        try {
          const isStaticHub =
            typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
          let pageRes = await fetch(
            isStaticHub
              ? `${SUPABASE_FUNCTIONS_API}/page?id=${encodeURIComponent(idParam)}`
              : `/api/page?id=${encodeURIComponent(idParam)}`
          );
          if (!pageRes.ok && !isStaticHub && (pageRes.status === 404 || pageRes.status === 405)) {
            pageRes = await fetch(
              `${SUPABASE_FUNCTIONS_API}/page?id=${encodeURIComponent(idParam)}`
            );
          }
          if (pageRes.ok) {
            const pageData = await pageRes.json();
            if (pageData?.pagina) {
              setIndiceDemoActivo(-1);
              setPaginaActiva(pageData.pagina);
              sincronizarSeoPagina(pageData.pagina);
              irAlLibro();
              return;
            }
          }
        } catch {
          // Fallback to default anthology entry
        }
      }

      const inicial = locales[0] || null;
      if (inicial) {
        setPaginaActiva(inicial);
      }
    }
    inicializar();
  }, []);

  function seleccionarEjemplo(i: number) {
    const par = PAREJAS_DEMO[i];
    if (!par) return;
    setIndiceDemoActivo(i);
    setBorges(par.borges.nombre);
    setBioy(par.bioy.nombre);
    setFecha(par.fechaEjemplo);
    setEscena(par.escenaEjemplo);
    setTema(par.temaEjemplo ?? '');
    setTono(par.tonoEjemplo ?? 'irónico');
    setError(null);
    setRechazo(null);

    const precomputada = ANTOLOGIA_INICIAL[i];
    if (precomputada) {
      setPaginaActiva(precomputada);
      sincronizarSeoPagina(precomputada);
      const url = new URL(window.location.href);
      url.searchParams.set('id', precomputada.id);
      window.history.replaceState({}, '', url.toString());
    }
  }

  function invertirRoles() {
    const prevBorges = borges;
    setBorges(bioy);
    setBioy(prevBorges);
    setIndiceDemoActivo(-1);
  }

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setCargando(true);
    setError(null);
    setRechazo(null);

    try {
      const payload = JSON.stringify({
        borges: borges.trim(),
        bioy: bioy.trim(),
        fecha: fecha.trim(),
        criticados: criticados.trim(),
        alabados: alabados.trim(),
        presentes: presentes.trim(),
        escena: escena.trim() || undefined,
        tema: tema.trim() || undefined,
        tono: tono.trim() || undefined,
        extension: 'media',
      });
      const isStaticHub =
        typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
      let res = await fetch(isStaticHub ? `${SUPABASE_FUNCTIONS_API}/generate` : '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      if (!isStaticHub && (res.status === 404 || res.status === 405)) {
        res = await fetch(`${SUPABASE_FUNCTIONS_API}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });
      }

      const data = await res.json();
      if (data.ok && data.pagina) {
        const nueva: PaginaPublica = data.pagina;
        setIndiceDemoActivo(-1);
        setPaginaActiva(nueva);
        setAntologia((prev) => [nueva, ...prev.filter((x) => x.id !== nueva.id)]);
        sincronizarSeoPagina(nueva);

        const url = new URL(window.location.href);
        url.searchParams.set('id', nueva.id);
        window.history.pushState({}, '', url.toString());

        document.getElementById('libro')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      if (data.etapa) {
        setRechazo(data as ResultadoRechazo);
      } else {
        setError(data.mensaje || 'No se pudo completar la página.');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#escribir" className="saltar">
        Saltar al generador
      </a>

      <header className="topbar">
        <div className="topbar-in">
          <a href="#top" className="marca-sitio" aria-label={NOMBRE_SITIO}>
            <span className="sello" aria-hidden="true">
              ❦
            </span>
            <span>
              <span className="rayo">rayo </span>borgesdebioyizador
            </span>
          </a>
          <nav className="nav-sitio" aria-label="Secciones">
            <a href="#escribir">Escribir</a>
            <a href="#ejemplos">Ejemplos</a>
          </nav>
          <BotonTema />
        </div>
      </header>

      <main id="top" className="flex-1 contenedor">
        {/* Cabecera editorial */}
        <section className="hero" aria-labelledby="titulo-sitio">
          <h1 id="titulo-sitio">{NOMBRE_SITIO}</h1>
          <div className="ornamento" aria-hidden="true">
            ❦
          </div>
          <p className="lema">
            Diarios apócrifos al estilo de las anotaciones de Adolfo Bioy Casares sobre Jorge Luis
            Borges.
          </p>
        </section>

        {/* Generador */}
        <section id="escribir" className="seccion" aria-labelledby="titulo-escribir">
          <div className="seccion-cab">
            <h2 id="titulo-escribir">Escribí tu diario</h2>
            <p>
              Elegí dos figuras públicas y una fecha para componer dos páginas del diario. ¿Sin ideas?{' '}
              <a href="#ejemplos">Mirá los ejemplos</a>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="panel">
            <fieldset>
              <legend>Protagonistas y fecha</legend>

              <div className="roles">
                <label className="campo">
                  <span className="etq">
                    Rol «Borges» <span className="req">*</span>
                  </span>
                  <input
                    name="borges"
                    required
                    value={borges}
                    onChange={(e) => {
                      setBorges(e.target.value);
                      setIndiceDemoActivo(-1);
                    }}
                    placeholder="Quien habla, sentencia y deslumbra"
                  />
                  <span className="ayuda">Quien lleva la voz cantante en las conversaciones.</span>
                </label>

                <button
                  type="button"
                  onClick={invertirRoles}
                  title="Invertir quién hace de Borges y quién anota como Bioy"
                  className="btn-invertir"
                >
                  <ArrowLeftRight aria-hidden="true" />
                  <span>Invertir roles</span>
                </button>

                <label className="campo">
                  <span className="etq">
                    Rol «Bioy» (el diarista) <span className="req">*</span>
                  </span>
                  <input
                    name="bioy"
                    required
                    value={bioy}
                    onChange={(e) => {
                      setBioy(e.target.value);
                      setIndiceDemoActivo(-1);
                    }}
                    placeholder="Quien lleva el diario, opina y discute"
                  />
                  <span className="ayuda">El amigo íntimo que anota por la noche lo conversado.</span>
                </label>
              </div>

              <div className="fila-extra">
                <label className="campo">
                  <span className="etq">
                    Fecha de la primera entrada <span className="req">*</span>
                  </span>
                  <input
                    name="fecha"
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => {
                      setFecha(e.target.value);
                      setIndiceDemoActivo(-1);
                    }}
                    className="tabular-nums"
                  />
                  <span className="ayuda">Fecha en la que comienza el diario.</span>
                </label>

                <label className="campo">
                  <span className="etq">Escena inicial</span>
                  <input
                    name="escena"
                    list="escenas"
                    value={escena}
                    onChange={(e) => setEscena(e.target.value)}
                    placeholder="Come en casa, vestuario, estudio de grabación…"
                  />
                  <datalist id="escenas">
                    {ESCENAS_SUGERIDAS.map((e) => (
                      <option key={e} value={e} />
                    ))}
                  </datalist>
                  <span className="ayuda">Situación con la que abre la primera entrada.</span>
                </label>
              </div>
            </fieldset>

            {/* Parámetros opcionales */}
            <div className="opcionales">
              <button
                type="button"
                onClick={() => setMostrarOptativos((v) => !v)}
                aria-expanded={mostrarOptativos}
                aria-controls="opciones-adicionales"
              >
                <span>Opciones adicionales (criticados, alabados, presentes, tema y tono)</span>
                {mostrarOptativos ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
              </button>

              {mostrarOptativos && (
                <div id="opciones-adicionales" className="cuerpo">
                  <label className="campo">
                    <span className="etq">Criticados</span>
                    <input
                      name="criticados"
                      value={criticados}
                      onChange={(e) => setCriticados(e.target.value)}
                      placeholder="Separados por comas"
                    />
                  </label>

                  <label className="campo">
                    <span className="etq">Alabados</span>
                    <input
                      name="alabados"
                      value={alabados}
                      onChange={(e) => setAlabados(e.target.value)}
                      placeholder="Separados por comas"
                    />
                  </label>

                  <label className="campo">
                    <span className="etq">Presentes en la escena</span>
                    <input
                      name="presentes"
                      value={presentes}
                      onChange={(e) => setPresentes(e.target.value)}
                      placeholder="Otras personas en la mesa"
                    />
                  </label>

                  <label className="campo">
                    <span className="etq">Tema o disparador</span>
                    <input
                      name="tema"
                      value={tema}
                      onChange={(e) => setTema(e.target.value)}
                      placeholder="Un partido, un libro, una traición…"
                    />
                  </label>

                  <label className="campo">
                    <span className="etq">Tono</span>
                    <input
                      name="tono"
                      list="tonos"
                      value={tono}
                      onChange={(e) => setTono(e.target.value)}
                      placeholder="ácido, melancólico, chismoso…"
                    />
                    <datalist id="tonos">
                      {TONOS.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </label>
                </div>
              )}
            </div>

            <div className="enviar">
              <button type="submit" disabled={cargando} className="btn-primario">
                {cargando ? 'Escribiendo en el cuaderno…' : 'Borgesdebioyizar'}
              </button>
            </div>
          </form>

          {error && (
            <div className="aviso" role="alert">
              <strong className="t">Aviso:</strong> {error}
            </div>
          )}

          {rechazo && (
            <section className="aviso" role="alert">
              <strong className="t">{rechazo.mensaje}</strong>
              {rechazo.errores && (
                <ul>
                  {rechazo.errores.map((e, i) => (
                    <li key={i}>
                      <strong>{e.campo}:</strong> {e.mensaje}
                    </li>
                  ))}
                </ul>
              )}
              {rechazo.validacion && <p style={{ margin: '0.5rem 0 0' }}>{rechazo.validacion.justificacion}</p>}
              {rechazo.chequeoFecha && (
                <ul>
                  {rechazo.chequeoFecha.motivos.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </section>

        {/* Ejemplos: selector y entrada activa (contenido secundario) */}
        <section id="ejemplos" className="seccion ejemplos-zona" aria-labelledby="titulo-ejemplos">
          <div className="seccion-cab">
            <h2 id="titulo-ejemplos">Ejemplos</h2>
            <p>
              {PAREJAS_DEMO.length} diarios de muestra. Elegí uno para leerlo y precargar el
              formulario.
            </p>
          </div>

          <ul className="rejilla-ejemplos">
            {PAREJAS_DEMO.map((par, i) => {
              const activo =
                indiceDemoActivo === i ||
                (borges.toLowerCase() === par.borges.nombre.toLowerCase() &&
                  bioy.toLowerCase() === par.bioy.nombre.toLowerCase() &&
                  fecha === par.fechaEjemplo);
              return (
                <li key={par.id}>
                  <button
                    type="button"
                    aria-pressed={activo}
                    onClick={() => {
                      seleccionarEjemplo(i);
                      document.getElementById('libro')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="tarjeta-ej"
                  >
                    <span className="nombres">
                      {par.borges.corto} <i>/</i> {par.bioy.corto}
                    </span>
                    <span className="meta">
                      <span className="amb">{par.ambito}</span>
                      <span className="tabular-nums">{fechaCorta(par.fechaEjemplo)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {paginaActiva && (
            <div id="libro" className="libro-zona">
              <div className="libro-cab">
                <p className="tipo">{indiceDemoActivo >= 0 ? 'Ejemplo' : 'Diario generado'}</p>
                <h3>{textoCompartir(paginaActiva)}</h3>
                <p>{MARCA}. Todo diálogo es inventado.</p>
              </div>

              <LibroAbierto entrada={paginaActiva.entrada} titulo={tituloDe(paginaActiva)} />

              <BarraAccionesDiario pagina={paginaActiva} />
            </div>
          )}
        </section>

        <section id="privacidad" className="seccion privacidad" aria-labelledby="titulo-privacidad">
          <div className="seccion-cab">
            <h2 id="titulo-privacidad">Privacidad</h2>
            <p>Qué guarda este sitio cuando generás un diario, y qué no.</p>
          </div>
          <div className="privacidad-texto">
            <p>
              <strong>Lo que escribís se guarda y es público.</strong> Al generar un diario, el
              servidor (funciones de Supabase) guarda la página resultante: los nombres, la fecha, la
              escena, el tema y el tono que ingresaste, la validación de los participantes, el
              contexto histórico y el texto generado, con un identificador corto al azar y la fecha de
              creación. Esa página queda con un enlace para compartir, y cualquiera que lo tenga
              puede leerla. El servidor también ofrece una lista pública de las páginas guardadas
              (identificador, fecha y primeras líneas). El código no las borra solo: no escribas datos
              personales ni nada que no quieras hacer público. Si querés que se elimine una página,
              abrí un{' '}
              <a href={`${REPOSITORIO_GITHUB}/issues`} target="_blank" rel="noreferrer noopener">
                issue en el repositorio
              </a>
              .
            </p>
            <p>
              <strong>Límite de uso.</strong> Para cuidar la cuota gratuita, el servidor cuenta cuántos
              diarios se piden por hora desde cada conexión y cuántos se piden en el día en total. Para
              eso guarda un hash con sal de tu dirección IP junto con un contador, nunca la dirección
              en sí. Los contadores se reinician por ventanas y los de más de dos días se borran
              periódicamente.
            </p>
            <p>
              <strong>Procesamiento por Google.</strong> Para escribir el diario, el texto que
              ingresás se envía a la API de Gemini de Google, que lo procesa según sus propias
              condiciones.
            </p>
            <p>
              <strong>Sin cuentas, cookies ni analítica.</strong> El sitio no pide registro, no usa
              cookies y no incluye herramientas de analítica ni publicidad. Lo único que se guarda en
              tu navegador es tu elección de modo claro u oscuro (localStorage, clave{' '}
              <code>bdb-tema</code>). Las tipografías se sirven desde este mismo sitio. Los botones de
              compartir son simples enlaces a WhatsApp y X: solo se abren si los tocás. Como en
              cualquier servicio web, GitHub Pages (que aloja el sitio) y Supabase (que aloja el
              servidor) pueden mantener sus propios registros técnicos de las conexiones.
            </p>
          </div>
        </section>
      </main>

      <footer className="pie">
        <div className="contenedor">
          <div className="ornamento" aria-hidden="true" style={{ marginBottom: '1.2rem' }}>
            ❦
          </div>
          <p>
            <strong>Parodia · Ficción generada por IA.</strong> Pastiche y homenaje no oficial: no
            está afiliado ni avalado por los herederos de Jorge Luis Borges o Adolfo Bioy Casares,
            sus editoriales ni las personas representadas. Todo diálogo es inventado y no
            constituye declaraciones reales.
          </p>
          <div className="enlaces">
            <a href={`${REPOSITORIO_GITHUB}/blob/main/DISCLAIMER.md`} target="_blank" rel="noreferrer noopener">
              Aviso completo
            </a>
            <a href="#privacidad">Privacidad</a>
            <a href={REPOSITORIO_GITHUB} target="_blank" rel="noreferrer noopener">
              Código
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
