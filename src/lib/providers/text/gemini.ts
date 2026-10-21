import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { Env, TextProvider, TextRequest, TextResponse } from '../types';
import type { Fuente } from '../../types';
import { mockText } from './mock';

const PAUSA_BUSQUEDA_MS = 15 * 60 * 1000;
let busquedaSinCuotaHasta = 0;

export function geminiText(env: Env): TextProvider {
  const key = env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    return mockText();
  }

  const ai = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const modelName = env.GEMINI_TEXT_MODEL?.split(',')[0]?.trim() || 'gemini-3.8-flash';
  const usarBusqueda = (env.GEMINI_SEARCH_GROUNDING ?? 'true') !== 'false';

  return {
    get nombre() {
      return `gemini:${modelName}`;
    },
    async generar(req: TextRequest): Promise<TextResponse> {
      let conBusqueda =
        Boolean(req.buscarEnWeb) && usarBusqueda && Date.now() >= busquedaSinCuotaHasta;

      const callModel = async (withSearch: boolean) => {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: req.user,
          config: {
            systemInstruction: req.system,
            temperature: req.tarea === 'entrada' ? 0.9 : 0.2,
            ...(req.json && !withSearch ? { responseMimeType: 'application/json' } : {}),
            thinkingConfig: {
              thinkingLevel:
                req.tarea === 'entrada' || req.tarea === 'revision'
                  ? ThinkingLevel.LOW
                  : ThinkingLevel.MEDIUM,
            },
            ...(withSearch ? { tools: [{ googleSearch: {} }] } : {}),
          },
        });
        return response;
      };

      let response;
      try {
        response = await callModel(conBusqueda);
      } catch (e: any) {
        if (conBusqueda && (e?.status === 429 || /429|quota/i.test(String(e?.message)))) {
          busquedaSinCuotaHasta = Date.now() + PAUSA_BUSQUEDA_MS;
          conBusqueda = false;
          response = await callModel(false);
        } else {
          throw e;
        }
      }

      const texto = response.text ?? '';
      if (!texto) {
        throw new Error('Gemini devolvió una respuesta vacía');
      }

      const chunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const fuentes: Fuente[] = chunks
        .map((c: any) => c?.web)
        .filter((w: any) => w?.uri)
        .map((w: any) => ({ titulo: w.title || w.uri, url: w.uri }));

      return {
        texto,
        fuentes,
        conBusquedaWeb: conBusqueda,
      };
    },
  };
}
