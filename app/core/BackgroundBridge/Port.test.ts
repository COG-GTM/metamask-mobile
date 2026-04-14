import Port from './Port';

jest.mock('../../util/browserScripts', () => ({
  JS_POST_MESSAGE_TO_PROVIDER: jest.fn((msg, origin) => `main_${JSON.stringify(msg)}_${origin}`),
  JS_IFRAME_POST_MESSAGE_TO_PROVIDER: jest.fn((msg, origin) => `iframe_${JSON.stringify(msg)}_${origin}`),
}));

describe('Port', () => {
  it('should create a Port instance', () => {
    const browserWindow = { injectJavaScript: jest.fn() };
    const port = new Port(browserWindow, true);
    expect(port).toBeDefined();
  });

  it('should post message using main frame script', () => {
    const browserWindow = { injectJavaScript: jest.fn() };
    const port = new Port(browserWindow, true);
    port.postMessage({ data: 'test' });
    expect(browserWindow.injectJavaScript).toHaveBeenCalled();
    const call = browserWindow.injectJavaScript.mock.calls[0][0];
    expect(call).toContain('main_');
  });

  it('should post message using iframe script for non-main frame', () => {
    const browserWindow = { injectJavaScript: jest.fn() };
    const port = new Port(browserWindow, false);
    port.postMessage({ data: 'test' });
    const call = browserWindow.injectJavaScript.mock.calls[0][0];
    expect(call).toContain('iframe_');
  });

  it('should handle null window gracefully', () => {
    const port = new Port(null, true);
    expect(() => port.postMessage({ data: 'test' })).not.toThrow();
  });

  it('should inherit from EventEmitter', () => {
    const port = new Port({}, true);
    expect(typeof port.on).toBe('function');
    expect(typeof port.emit).toBe('function');
  });
});
