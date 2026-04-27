import { GlobalErrorHandler } from './global-error-handler';

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    handler = new GlobalErrorHandler();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('logs the error message and stack for Error instances', () => {
    const err = new Error('Something broke');
    handler.handleError(err);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const args = consoleSpy.mock.calls[0];
    expect(args[0]).toMatch(/\[Aeternum .+\]/);
    expect(args[1]).toBe('Something broke');
    expect(args[2]).toContain('Something broke'); // stack
  });

  it('converts non-Error values to string for logging', () => {
    handler.handleError('plain string error');
    const args = consoleSpy.mock.calls[0];
    expect(args[1]).toBe('plain string error');
  });

  it('handles object errors by stringifying them', () => {
    handler.handleError({ message: 'obj error' });
    const args = consoleSpy.mock.calls[0];
    expect(args[1]).toBe('[object Object]');
  });

  it('includes ISO timestamp in the log prefix', () => {
    handler.handleError(new Error('ts test'));
    const prefix: string = consoleSpy.mock.calls[0][0];
    expect(prefix).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
