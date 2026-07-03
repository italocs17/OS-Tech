import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatCurrency, formatDateTime } from '../lib/utils';

const NBSP = '\u00A0';

describe('cn', () => {
  it('concatena classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('filtra valores falsy', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });

  it('retorna string vazia sem argumentos', () => {
    expect(cn()).toBe('');
  });
});

describe('formatDate', () => {
  it('formata data ISO para pt-BR', () => {
    expect(formatDate('2026-06-24T12:00:00')).toBe('24/06/2026');
  });

  it('retorna "-" para null/undefined', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate(undefined)).toBe('-');
  });

  it('retorna "-" para data invalida', () => {
    expect(formatDate('invalido')).toBe('-');
  });
});

describe('formatCurrency', () => {
  it('formata valor para BRL', () => {
    expect(formatCurrency(1234.56)).toBe(`R$${NBSP}1.234,56`);
  });

  it('formata zero', () => {
    expect(formatCurrency(0)).toBe(`R$${NBSP}0,00`);
  });

  it('retorna "R$ 0,00" para null/undefined', () => {
    expect(formatCurrency(null)).toBe('R$ 0,00');
    expect(formatCurrency(undefined)).toBe('R$ 0,00');
  });
});

describe('formatDateTime', () => {
  it('formata data e hora para pt-BR', () => {
    const result = formatDateTime('2026-06-24T14:30:00');
    expect(result).toContain('24/06/2026');
  });

  it('retorna "-" para null', () => {
    expect(formatDateTime(null)).toBe('-');
  });
});
