import { describe, expect, it } from 'vitest';
import { pedidoDelDiario } from '../src/lib/pedido';
import type { PaginaPublica } from '../src/lib/storage/tipos';

const base = {
  id: 'abcdefgh',
  parametros: { borges: 'A Uno', bioy: 'B Dos', fecha: '2026-10-07', criticados: ['C Tres', 'D Cuatro'], alabados: [], presentes: [], tema: 'Un tema', extension: 'media', paginas: 2 },
} as unknown as PaginaPublica;

describe('pedidoDelDiario', () => {
  it('sin pedido literal, lee los parámetros guardados', () => {
    const x = pedidoDelDiario(base);
    expect(x.criticados).toBe('C Tres, D Cuatro');
    expect(x.alabados).toBe('');
    expect(x.tema).toBe('Un tema');
    expect(x.tono).toBe('');
    expect(x.escena).toBe('');
  });
  it('con pedido literal, lo muestra tal cual', () => {
    const x = pedidoDelDiario({ ...base, pedido: { criticados: ' C Tres; D Cuatro ', tono: 'irónico' } });
    expect(x.criticados).toBe(' C Tres; D Cuatro ');
    expect(x.tono).toBe('irónico');
    expect(x.borges).toBe('A Uno');
  });
});
