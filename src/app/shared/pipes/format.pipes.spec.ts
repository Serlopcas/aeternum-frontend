import { CurrencyPipe, DateFormatPipe, DateTimeFormatPipe, PercentPipe } from './format.pipes';

// ─── CurrencyPipe ───────────────────────────────────────────────────────────

describe('CurrencyPipe', () => {
  let pipe: CurrencyPipe;

  beforeEach(() => {
    pipe = new CurrencyPipe();
  });

  it('formats a positive number with 2 decimal places and default € symbol', () => {
    const result = pipe.transform(1234.5);
    expect(result).toContain('1234,50');
    expect(result).toContain('€');
  });

  it('formats zero correctly', () => {
    const result = pipe.transform(0);
    expect(result).toContain('0,00');
  });

  it('formats a negative number', () => {
    const result = pipe.transform(-99.99);
    expect(result).toContain('99,99');
  });

  it('returns "—" for null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('returns "—" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('uses a custom currency symbol when provided', () => {
    const result = pipe.transform(100, '$');
    expect(result).toContain('$');
    expect(result).not.toContain('€');
  });

  it('rounds to 2 decimal places', () => {
    const result = pipe.transform(1.005);
    // toLocaleString rounds at 2 decimals
    expect(result).toMatch(/1,0[01]/);
  });
});

// ─── PercentPipe ─────────────────────────────────────────────────────────────

describe('PercentPipe', () => {
  let pipe: PercentPipe;

  beforeEach(() => {
    pipe = new PercentPipe();
  });

  it('formats a decimal percentage with up to 2 decimal places', () => {
    const result = pipe.transform(23.5);
    expect(result).toContain('23,5');
    expect(result).toContain('%');
  });

  it('formats an integer percentage with one decimal place', () => {
    const result = pipe.transform(50);
    expect(result).toContain('50,0');
  });

  it('returns "—" for null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('returns "—" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('formats 0 correctly', () => {
    const result = pipe.transform(0);
    expect(result).toContain('0,0');
  });
});

// ─── DateFormatPipe ──────────────────────────────────────────────────────────

describe('DateFormatPipe', () => {
  let pipe: DateFormatPipe;

  beforeEach(() => {
    pipe = new DateFormatPipe();
  });

  it('returns "—" for null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('returns "—" for an empty string', () => {
    expect(pipe.transform('')).toBe('—');
  });

  it('returns "—" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('formats an ISO date string to dd/mm/yyyy', () => {
    const result = pipe.transform('2026-04-27');
    expect(result).toMatch(/27\/04\/2026/);
  });

  it('formats a full ISO datetime string to date only', () => {
    const result = pipe.transform('2026-12-25T10:30:00Z');
    expect(result).toMatch(/25\/12\/2026/);
  });
});

// ─── DateTimeFormatPipe ──────────────────────────────────────────────────────

describe('DateTimeFormatPipe', () => {
  let pipe: DateTimeFormatPipe;

  beforeEach(() => {
    pipe = new DateTimeFormatPipe();
  });

  it('returns "—" for null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('returns "—" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('formats an ISO datetime string with both date and time parts', () => {
    // Use a fixed time in UTC+0 to avoid TZ ambiguity in test environment
    const result = pipe.transform('2026-04-27T00:00:00Z');
    // Should contain year and a formatted time — just verify structure
    expect(result).toContain('2026');
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});
