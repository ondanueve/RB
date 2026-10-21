/**
 * Rasterizado en el navegador (canvas): página impresa e imagen para compartir, sin servidor.
 * Las fuentes (Liberation, OFL) se incrustan en el SVG como data URL para que el resultado
 * sea fiel en cualquier dispositivo.
 */

const FUENTES: [string, string, string, string][] = [
  ['Liberation Serif', 'normal', 'normal', 'LiberationSerif-Regular.ttf'],
  ['Liberation Serif', 'italic', 'normal', 'LiberationSerif-Italic.ttf'],
  ['Liberation Serif', 'normal', 'bold', 'LiberationSerif-Bold.ttf'],
  ['Liberation Sans', 'normal', 'normal', 'LiberationSans-Regular.ttf'],
];

let css: Promise<string> | null = null;

function fuentesCSS(): Promise<string> {
  css ??= Promise.all(
    FUENTES.map(async ([fam, estilo, peso, archivo]) => {
      try {
        let res = await fetch(`./fonts/${archivo}`);
        if (!res.ok) res = await fetch(`/fonts/${archivo}`);
        if (!res.ok) return '';
        const b = await res.blob();
        const url = await new Promise<string>((ok, mal) => {
          const fr = new FileReader();
          fr.onload = () => ok(String(fr.result));
          fr.onerror = mal;
          fr.readAsDataURL(b);
        });
        return `@font-face{font-family:"${fam}";font-style:${estilo};font-weight:${peso};src:url(${url}) format("truetype");}`;
      } catch {
        return '';
      }
    })
  ).then((x) => x.join(''));
  return css;
}

export async function svgAPng(svg: string, escala = 1): Promise<Blob> {
  const estilo = await fuentesCSS();
  const conFuentes = estilo
    ? svg.replace(/(<svg[^>]*>)/, `$1<defs><style>${estilo}</style></defs>`)
    : svg;
  const w = Number(/width="(\d+)"/.exec(svg)?.[1] ?? 1000);
  const h = Number(/height="(\d+)"/.exec(svg)?.[1] ?? 1500);
  const img = new Image();
  const url = URL.createObjectURL(new Blob([conFuentes], { type: 'image/svg+xml' }));
  try {
    await new Promise<void>((ok, mal) => {
      img.onload = () => ok();
      img.onerror = () => mal(new Error('No se pudo dibujar la imagen.'));
      img.src = url;
    });
    await (img.decode?.().catch(() => {}) ?? Promise.resolve());
    const c = document.createElement('canvas');
    c.width = Math.round(w * escala);
    c.height = Math.round(h * escala);
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((ok, mal) =>
      c.toBlob((b) => (b ? ok(b) : mal(new Error('toBlob falló'))), 'image/png')
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function bajarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
