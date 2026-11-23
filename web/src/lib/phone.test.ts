import { describe, expect, it } from 'vitest';
import { normalizePhone } from './phone';

describe('normalizePhone', () => {
  it('reads a bare 10-digit US number as US', () => {
    expect(normalizePhone('503-555-0123')).toBe('+15035550123');
    expect(normalizePhone('(503) 555 0123')).toBe('+15035550123');
  });

  it('reads an 11-digit number starting with 1 as US', () => {
    expect(normalizePhone('1 503 555 0123')).toBe('+15035550123');
  });

  it('keeps an explicit country code', () => {
    expect(normalizePhone('+44 20 7946 0958')).toBe('+442079460958');
  });

  it('trims whitespace', () => {
    expect(normalizePhone('  +15035550123  ')).toBe('+15035550123');
  });

  it('rejects empty and letter-only input', () => {
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone('call me')).toBeNull();
  });

  it('rejects numbers that are too short or too long', () => {
    expect(normalizePhone('555-0123')).toBeNull();
    expect(normalizePhone('+1234567890123456')).toBeNull();
  });

  it('rejects a country code that starts with 0', () => {
    expect(normalizePhone('+0123456789')).toBeNull();
  });
});
