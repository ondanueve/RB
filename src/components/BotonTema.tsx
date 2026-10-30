import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Tema = 'dark' | 'light';
const CLAVE = 'bdb-tema';
const COLOR: Record<Tema, string> = { dark: '#15110e', light: '#f4ecdc' };

function aplicar(t: Tema) {
  document.documentElement.setAttribute('data-theme', t);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR[t]);
}

/**
 * Alterna oscuro/claro y lo recuerda en localStorage. Oscuro por defecto (no sigue prefers-color-scheme).
 * El atributo inicial lo fija el script de index.html antes de montar React, para no parpadear en claro.
 * Los dos íconos están siempre en el DOM y el CSS muestra uno u otro: el prerender y la hidratación coinciden.
 */
export function BotonTema() {
  const [tema, setTema] = useState<Tema>('dark');

  useEffect(() => {
    setTema(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  }, []);

  function alternar() {
    const nuevo: Tema = tema === 'dark' ? 'light' : 'dark';
    setTema(nuevo);
    aplicar(nuevo);
    try {
      localStorage.setItem(CLAVE, nuevo);
    } catch {
      // modo privado o almacenamiento bloqueado: el cambio vale solo para esta visita
    }
  }

  const aClaro = tema === 'dark';
  return (
    <button
      type="button"
      className="btn-tema"
      onClick={alternar}
      aria-label={aClaro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={aClaro ? 'Modo claro' : 'Modo oscuro'}
    >
      <Moon className="ico-luna" aria-hidden="true" />
      <Sun className="ico-sol" aria-hidden="true" />
      <span className="txt">{aClaro ? 'Claro' : 'Oscuro'}</span>
    </button>
  );
}
