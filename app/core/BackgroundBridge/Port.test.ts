import Port from './Port';

describe('Port', () => {
  it('injects messages into the WebView until closed', () => {
    const browserWindow = { injectJavaScript: jest.fn() };
    const port = new Port(browserWindow, true);

    port.postMessage({ id: 1 });
    expect(browserWindow.injectJavaScript).toHaveBeenCalledTimes(1);

    port.close();
    port.postMessage({ id: 2 });
    expect(browserWindow.injectJavaScript).toHaveBeenCalledTimes(1);
  });
});
