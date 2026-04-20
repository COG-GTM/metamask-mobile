import Port from './Port';
import {
  JS_POST_MESSAGE_TO_PROVIDER,
  JS_IFRAME_POST_MESSAGE_TO_PROVIDER,
} from '../../util/browserScripts';

describe('Port', () => {
  it('is a constructor that supports EventEmitter APIs', () => {
    const port = new Port({ injectJavaScript: jest.fn() }, true);
    const listener = jest.fn();
    port.on('custom-event', listener);
    port.emit('custom-event', 'payload');
    expect(listener).toHaveBeenCalledWith('payload');
  });

  it('injects main frame provider script on postMessage when isMainFrame is true', () => {
    const injectJavaScript = jest.fn();
    const port = new Port({ injectJavaScript }, true);

    const msg = { data: { method: 'eth_chainId' } };
    port.postMessage(msg, 'https://example.com');

    expect(injectJavaScript).toHaveBeenCalledTimes(1);
    expect(injectJavaScript).toHaveBeenCalledWith(
      JS_POST_MESSAGE_TO_PROVIDER(msg, 'https://example.com'),
    );
  });

  it('injects iframe provider script on postMessage when isMainFrame is false', () => {
    const injectJavaScript = jest.fn();
    const port = new Port({ injectJavaScript }, false);

    const msg = { data: { method: 'eth_accounts' } };
    port.postMessage(msg);

    expect(injectJavaScript).toHaveBeenCalledTimes(1);
    expect(injectJavaScript).toHaveBeenCalledWith(
      JS_IFRAME_POST_MESSAGE_TO_PROVIDER(msg, '*'),
    );
  });

  it('does not throw when the browser window is missing', () => {
    const port = new Port(undefined, true);
    expect(() => port.postMessage({ data: {} })).not.toThrow();
  });
});
