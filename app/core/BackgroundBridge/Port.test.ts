import Port from './Port';

describe('Port', () => {
  const createWindow = () => ({ injectJavaScript: jest.fn() });

  it('injects a postMessage call targeted at a valid origin', () => {
    const browserWindow = createWindow();
    const port = new Port(browserWindow, true);

    port.postMessage({ id: 1 }, 'https://app.uniswap.org');

    expect(browserWindow.injectJavaScript).toHaveBeenCalledTimes(1);
    const script = browserWindow.injectJavaScript.mock.calls[0][0];
    expect(script).toContain(
      'window.postMessage({"id":1}, "https://app.uniswap.org")',
    );
  });

  it.each(["https://x');alert(1);('", 'null', '*', '', undefined])(
    'does not inject anything for target origin %p',
    (origin) => {
      const browserWindow = createWindow();
      const port = new Port(browserWindow, true);

      port.postMessage({ id: 1 }, origin as string);

      expect(browserWindow.injectJavaScript).not.toHaveBeenCalled();
    },
  );
});
