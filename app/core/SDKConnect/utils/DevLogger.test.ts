import { DevLogger } from './DevLogger';

describe('DevLogger', () => {
  it('should export a log function', () => {
    expect(typeof DevLogger.log).toBe('function');
  });

  it('should not throw when called', () => {
    expect(() => DevLogger.log('test message')).not.toThrow();
  });

  it('should call console.debug in DEV mode', () => {
    const originalEnv = process.env.SDK_DEV;
    process.env.SDK_DEV = 'DEV';
    const spy = jest.spyOn(console, 'debug').mockImplementation();

    DevLogger.log('test');
    expect(spy).toHaveBeenCalledWith('test');

    spy.mockRestore();
    process.env.SDK_DEV = originalEnv;
  });

  it('should not call console.debug when not in DEV mode', () => {
    const originalEnv = process.env.SDK_DEV;
    process.env.SDK_DEV = undefined;
    const spy = jest.spyOn(console, 'debug').mockImplementation();

    DevLogger.log('test');
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
    process.env.SDK_DEV = originalEnv;
  });
});
