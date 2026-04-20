import DevLogger, { DevLogger as NamedDevLogger } from './DevLogger';

describe('DevLogger', () => {
  it('exposes a log function', () => {
    expect(typeof DevLogger.log).toBe('function');
  });

  it('default and named exports point to the same object', () => {
    expect(DevLogger).toBe(NamedDevLogger);
  });

  it('does not throw when log is invoked with various argument shapes', () => {
    const debugSpy = jest
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);
    try {
      expect(() => DevLogger.log()).not.toThrow();
      expect(() => DevLogger.log('a')).not.toThrow();
      expect(() => DevLogger.log('a', 1, { b: 2 })).not.toThrow();
    } finally {
      debugSpy.mockRestore();
    }
  });

  it('does not log when SDK_DEV is not DEV (default test env)', () => {
    // The tests environment does not set SDK_DEV to 'DEV', so log should
    // be a no-op. babel-plugin-transform-inline-environment-variables inlines
    // process.env.SDK_DEV at compile time, so we cannot toggle it at runtime.
    const debugSpy = jest
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);
    try {
      DevLogger.log('silent-call-marker');
      expect(
        debugSpy.mock.calls.some((call) => call[0] === 'silent-call-marker'),
      ).toBe(false);
    } finally {
      debugSpy.mockRestore();
    }
  });
});
