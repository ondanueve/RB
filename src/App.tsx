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

export default function App() {
  // Form state (default: Messi / Scaloni, index 0)
  const [borges, setBorges] = useState<string>(PAREJAS_DEMO[0].borges.nombre);
  const [bioy, setBioy] = useState<string>(PAREJAS_DEMO[0].bioy.nombre);
  const [fecha, setFecha] = useState<string>(PAREJAS_DEMO[0].fechaEjemplo);
  const [escena, setEscena] = useState<string>(PAREJAS_DEMO[0].escenaEjemplo);
  const [criticados, setCriticados] = useState<string>('');
  const [alabados, setAlabados] = useState<string>('');
  const [presentes, setPresentes] = useState<string>('');
  const [tema, setTema] = useState<string>('');
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
          setPaginaActiva(encontrada);
          sincronizarSeoPagina(encontrada);
          return;
        }
        try {
          const isStaticHub =
            typeof window !== 'undefined' && window.location.hostname.endsWith('bitcoinizate.com');
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
        typeof window !== 'undefined' && window.location.hostname.endsWith('bitcoinizate.com');
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
      {/* Main Content */}
      <main id="top" className="flex-1 max-w-[1160px] w-full mx-auto px-5 sm:px-8 py-10 space-y-10">
        {/* Editorial Header */}
        <header className="text-center max-w-3xl mx-auto space-y-2">
          <h1
            className="text-4xl sm:text-5xl font-normal tracking-wide text-[#1d1a16] m-0"
            style={{ textWrap: 'balance' }}
          >
            {NOMBRE_SITIO}
          </h1>
          <hr className="border-0 border-t border-[#5b5246] w-28 mx-auto my-3" />
          <p className="text-lg italic text-[#5b5246] m-0">
            Diarios apócrifos al estilo de las anotaciones de Adolfo Bioy Casares sobre Jorge Luis
            Borges.
          </p>
        </header>

        {/* Curated Pairs Selector */}
        <section className="space-y-6">
          <div className="p-4 bg-[#fbf6ea]/70 border border-[#d4c5a6] space-y-2.5">
            <div className="text-[14.5px] text-[#5b5246]">
              <strong>Ejemplos:</strong>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {PAREJAS_DEMO.map((par, i) => {
                const activo =
                  indiceDemoActivo === i ||
                  (borges.toLowerCase() === par.borges.nombre.toLowerCase() &&
                    bioy.toLowerCase() === par.bioy.nombre.toLowerCase() &&
                    fecha === par.fechaEjemplo);
                return (
                  <button
                    key={par.id}
                    type="button"
                    onClick={() => seleccionarEjemplo(i)}
                    className={`px-3 py-1.5 text-[14.5px] transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      activo
                        ? 'bg-[#7a1f1f] text-[#fbf3e2]'
                        : 'bg-[#fffdf7] text-[#1d1a16] border border-[#c9b994] hover:border-[#7a1f1f]'
                    }`}
                  >
                    {par.borges.corto} / {par.bioy.corto} ({par.fechaEjemplo.slice(0, 4)})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Open-Book Spread */}
          {paginaActiva && (
            <div id="libro" className="space-y-4 scroll-mt-10 pt-2">
              <div className="text-center space-y-1">
                <h2 className="text-2xl sm:text-3xl font-normal text-[#1d1a16] m-0">
                  {textoCompartir(paginaActiva)}
                </h2>
                <p className="text-[14.5px] italic text-[#5b5246] m-0">
                  {MARCA}. Todo diálogo es inventado.
                </p>
              </div>

              <LibroAbierto entrada={paginaActiva.entrada} titulo={tituloDe(paginaActiva)} />

              <BarraAccionesDiario pagina={paginaActiva} />
            </div>
          )}
        </section>

        {/* Composition Form */}
        <section id="escribir" className="pt-6 border-t border-[#d4c5a6] space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-normal text-[#1d1a16] m-0">
              Escribir otro diario
            </h2>
            <p className="text-[15.5px] italic text-[#5b5246] mt-1">
              Elegí dos figuras públicas y una fecha para componer dos páginas del diario.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-[#fbf6ea]/65 border border-[#d4c5a6] p-6 sm:p-8 space-y-6 shadow-sm"
          >
            <fieldset className="border border-[#d4c5a6] p-5 m-0 space-y-5">
              <legend className="px-2 text-[15px] uppercase tracking-widest text-[#7a1f1f] font-semibold">
                Protagonistas y fecha
              </legend>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Borges Role */}
                <label className="lg:col-span-5 grid gap-1.5 text-[16px]">
                  <span className="font-semibold text-[#1d1a16]">
                    Rol «Borges» <span className="text-[#7a1f1f]">*</span>
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
                    className="px-3 py-2 bg-[#fffdf7] border border-[#c9b994] text-[#1d1a16] text-[16px] focus:outline-none focus:border-[#7a1f1f]"
                  />
                  <span className="text-[13.5px] italic text-[#5b5246]">
                    Quien lleva la voz cantante en las conversaciones.
                  </span>
                </label>

                {/* Role Swap Button */}
                <div className="lg:col-span-2 flex flex-col items-center justify-center pt-1 lg:pt-7">
                  <button
                    type="button"
                    onClick={invertirRoles}
                    title="Invertir quién hace de Borges y quién anota como Bioy"
                    className="flex items-center gap-1.5 px-3 py-2 text-[13.5px] border border-[#c9b994] bg-[#fffdf7] text-[#5b5246] hover:text-[#7a1f1f] hover:border-[#7a1f1f] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Invertir roles</span>
                  </button>
                </div>

                {/* Bioy Role */}
                <label className="lg:col-span-5 grid gap-1.5 text-[16px]">
                  <span className="font-semibold text-[#1d1a16]">
                    Rol «Bioy» (el diarista) <span className="text-[#7a1f1f]">*</span>
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
                    className="px-3 py-2 bg-[#fffdf7] border border-[#c9b994] text-[#1d1a16] text-[16px] focus:outline-none focus:border-[#7a1f1f]"
                  />
                  <span className="text-[13.5px] italic text-[#5b5246]">
                    El amigo íntimo que anota por la noche lo conversado.
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#e5d9c0]">
                <label className="grid gap-1.5 text-[16px]">
                  <span className="font-semibold text-[#1d1a16]">
                    Fecha de la primera entrada <span className="text-[#7a1f1f]">*</span>
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
                    className="px-3 py-2 bg-[#fffdf7] border border-[#c9b994] text-[#1d1a16] text-[16px] tabular-nums focus:outline-none focus:border-[#7a1f1f]"
                  />
                  <span className="text-[13.5px] italic text-[#5b5246]">
                    Fecha en la que comienza el diario.
                  </span>
                </label>

                <label className="grid gap-1.5 text-[16px]">
                  <span className="font-semibold text-[#1d1a16]">Escena inicial</span>
                  <input
                    name="escena"
                    list="escenas"
                    value={escena}
                    onChange={(e) => setEscena(e.target.value)}
                    placeholder="Come en casa, vestuario, estudio de grabación…"
                    className="px-3 py-2 bg-[#fffdf7] border border-[#c9b994] text-[#1d1a16] text-[16px] focus:outline-none focus:border-[#7a1f1f]"
                  />
                  <datalist id="escenas">
                    {ESCENAS_SUGERIDAS.map((e) => (
                      <option key={e} value={e} />
                    ))}
                  </datalist>
                  <span className="text-[13.5px] italic text-[#5b5246]">
                    Situación con la que abre la primera entrada.
                  </span>
                </label>
              </div>
            </fieldset>

            {/* Collapsible Optional Parameters */}
            <div className="border border-[#d4c5a6] bg-[#f4ecdc]/45">
              <button
                type="button"
                onClick={() => setMostrarOptativos((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-left text-[15px] text-[#7a1f1f] font-semibold tracking-wide hover:bg-[#ede1ca]/60 transition-colors cursor-pointer"
              >
                <span>
                  Opciones adicionales (criticados, alabados, presentes, tema y tono)
                </span>
                {mostrarOptativos ? (
                  <ChevronUp className="w-4 h-4 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 shrink-0" />
                )}
              </button>

              {mostrarOptativos && (
                <div className="p-5 border-t border-[#d4c5a6] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <label className="grid gap-1 text-[15.5px]">
                    <span>Criticados</span>
                    <input
                      name="criticados"
                      value={criticados}
                      onChange={(e) => setCriticados(e.target.value)}
                      placeholder="Separados por comas"
                      className="px-3 py-1.5 bg-[#fffdf7] border border-[#c9b994] text-[#1d1a16]"
                    />
                  </label>

                  <label className="grid gap-1 text-[15.5px]">
                    <span>Alabados</span>
                    <input
                      name="alabados"
                      value={alabados}
                      onChange={(e) => setAlabados(e.target.value)}
                      placeholder="Separados por comas"
                      className="px-3 py-1.5 bg-[#fffdf7] border border-[#c9b994] text-[#1d1a16]"
                    />
                  </label>

                  <label className="grid gap-1 text-[15.5px]">
                    <span>Presentes en la escena</span>
                    <input
                      name="presentes"
                      value={presentes}
                      onChange={(e) => setPresentes(e.target.value)}
                      placeholder="Otras personas en la mesa"
                      className="px-3 py-1.5 bg-[#fffdf7] border border-[#c9b994] text-[#1d1a16]"
                    />
                  </label>

                  <label className="grid gap-1 text-[15.5px]">
                    <span>Tema o disparador</span>
                    <input
                      name="tema"
                      value={tema}
                      onChange={(e) => setTema(e.target.value)}
                      placeholder="Un partido, un libro, una traición…"
                      className="px-3 py-1.5 bg-[#fffdf7] border border-[#c9b994] text-[#1d1a16]"
                    />
                  </label>

                  <label className="grid gap-1 text-[15.5px]">
                    <span>Tono</span>
                    <input
                      name="tono"
                      list="tonos"
                      value={tono}
                      onChange={(e) => setTono(e.target.value)}
                      placeholder="ácido, melancólico, chismoso…"
                      className="px-3 py-1.5 bg-[#fffdf7] border border-[#c9b994] text-[#1d1a16]"
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

            {/* Submit */}
            <div className="flex flex-col items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={cargando}
                className="px-8 py-3 text-lg tracking-widest uppercase bg-[#7a1f1f] text-[#fbf3e2] hover:bg-[#5e1616] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {cargando ? 'Escribiendo en el cuaderno…' : 'Borgesdebioyizar'}
              </button>
            </div>
          </form>

          {/* Error or Rejection Feedback */}
          {error && (
            <div className="p-4 bg-[#7a1f1f]/10 border border-[#7a1f1f] text-[#1d1a16] text-[16px]">
              <strong>Aviso:</strong> {error}
            </div>
          )}

          {rechazo && (
            <section className="p-5 bg-[#fbf6ea] border border-[#7a1f1f] space-y-2">
              <div className="text-[16px] text-[#1d1a16]">
                <strong className="text-[#7a1f1f]">{rechazo.mensaje}</strong>
                {rechazo.errores && (
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-[15px]">
                    {rechazo.errores.map((e, i) => (
                      <li key={i}>
                        <strong>{e.campo}:</strong> {e.mensaje}
                      </li>
                    ))}
                  </ul>
                )}
                {rechazo.validacion && (
                  <p className="mt-2 text-[15.5px]">{rechazo.validacion.justificacion}</p>
                )}
                {rechazo.chequeoFecha && (
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-[15px]">
                    {rechazo.chequeoFecha.motivos.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </section>
      </main>

      {/* Authentic Literary Footer */}
      <footer className="max-w-[1160px] w-full mx-auto px-5 sm:px-8 py-8 mt-10 border-t border-[#d4c5a6] text-[14.5px] text-[#5b5246]">
        <p className="m-0 leading-relaxed">
          <strong className="text-[#1d1a16]">Parodia · Ficción generada por IA.</strong> Pastiche y
          homenaje no oficial: no está afiliado ni avalado por los herederos de Jorge Luis Borges o
          Adolfo Bioy Casares, sus editoriales ni las personas representadas. Todo diálogo es
          inventado y no constituye declaraciones reales.{' '}
          <a
            href={`${REPOSITORIO_GITHUB}/blob/main/DISCLAIMER.md`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[#7a1f1f] underline"
          >
            Aviso completo
          </a>{' '}
          ·{' '}
          <a
            href={REPOSITORIO_GITHUB}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[#7a1f1f] underline"
          >
            Código
          </a>{' '}
          ·{' '}
          <a
            href="https://bitcoinizate.com/"
            target="_blank"
            rel="noreferrer noopener"
            className="text-[#7a1f1f] underline"
          >
            Bitcoinizate
          </a>
        </p>
      </footer>
    </div>
  );
}
