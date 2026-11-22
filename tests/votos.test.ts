import { describe, expect, it } from 'vitest';
import { sePuedeVotar } from '../src/lib/votos';

describe('votos (cliente)', () => {
  it('solo se votan diarios guardados, no los ejemplos', () => {
    expect(sePuedeVotar('SXmZ4u5nQ7')).toBe(true);
    expect(sePuedeVotar('demo3borges')).toBe(false);
    expect(sePuedeVotar('x')).toBe(false);
    expect(sePuedeVotar(null)).toBe(false);
  });
});
