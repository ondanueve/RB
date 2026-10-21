import type { Env, ImageProvider, TextProvider } from './types';
import { mockText } from './text/mock';
import { geminiText } from './text/gemini';
import { mockImage } from './image/mock';

export function textProvider(env: Env = process.env): TextProvider {
  const pref = (env.TEXT_PROVIDER || '').toLowerCase();
  if (pref === 'mock') return mockText();
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    return geminiText(env);
  }
  return mockText();
}

export function imageProvider(env: Env = process.env): ImageProvider | null {
  switch ((env.IMAGE_PROVIDER || 'none').toLowerCase()) {
    case 'mock':
      return mockImage();
    case 'none':
    default:
      return null;
  }
}

export type { TextProvider, ImageProvider, Env } from './types';
