import { describe, it, expect } from 'vitest';
import { FIBONACCI, T_SHIRT } from '@/types';

describe('FIBONACCI voting system', () => {
  it('contains expected Fibonacci values', () => {
    expect(FIBONACCI).toContain('0');
    expect(FIBONACCI).toContain('1');
    expect(FIBONACCI).toContain('2');
    expect(FIBONACCI).toContain('3');
    expect(FIBONACCI).toContain('5');
    expect(FIBONACCI).toContain('8');
    expect(FIBONACCI).toContain('13');
    expect(FIBONACCI).toContain('21');
  });

  it('contains special cards', () => {
    expect(FIBONACCI).toContain('?');
    expect(FIBONACCI).toContain('☕');
  });

  it('has all values as strings', () => {
    FIBONACCI.forEach(v => expect(typeof v).toBe('string'));
  });
});

describe('T_SHIRT voting system', () => {
  it('contains expected T-Shirt sizes in order', () => {
    const sizes = T_SHIRT.filter(v => v !== '?' && v !== '☕');
    expect(sizes).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  });

  it('contains special cards', () => {
    expect(T_SHIRT).toContain('?');
    expect(T_SHIRT).toContain('☕');
  });
});
