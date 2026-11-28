import { describe, expect, it } from 'vitest';
import { autoRunDays, isAutoRunWindow } from './auto-assign';

describe('isAutoRunWindow', () => {
  it('is true at 8:30 p.m. Eastern on Wednesday (standard time)', () => {
    expect(isAutoRunWindow(new Date('2026-11-26T01:30:00Z'))).toBe(true);
  });

  it('is true at 8:30 p.m. Eastern on Wednesday (daylight time)', () => {
    expect(isAutoRunWindow(new Date('2026-07-23T00:30:00Z'))).toBe(true);
  });

  it('is false at 7:59 p.m. Eastern on Wednesday', () => {
    expect(isAutoRunWindow(new Date('2026-11-26T00:59:00Z'))).toBe(false);
  });

  it('is false at 8:30 p.m. Eastern on Thursday', () => {
    expect(isAutoRunWindow(new Date('2026-11-27T01:30:00Z'))).toBe(false);
  });
});

describe('autoRunDays', () => {
  it('returns Thursday to Sunday of the given week only', () => {
    expect(autoRunDays('2026-11-23')).toEqual(['2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29']);
  });
});
