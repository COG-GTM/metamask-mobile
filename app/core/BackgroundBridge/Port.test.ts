import Port from './Port';

describe('Port', () => {
  it('injects a postMessage script for a valid origin', () => {
    const injectJavaScript = jest.fn();
    const port = new Port({ injectJavaScript }, true);

    port.postMessage({ foo: 'bar' }, 'https://metamask.io');

    expect(injectJavaScript).toHaveBeenCalledTimes(1);
    expect(injectJavaScript.mock.calls[0][0]).toContain(
      '"https://metamask.io"',
    );
  });

  it.each(["https://x');alert(1);('", '*', 'null', undefined])(
    'does not inject anything for invalid origin %s',
    (origin) => {
      const injectJavaScript = jest.fn();
      const port = new Port({ injectJavaScript }, true);

      port.postMessage({ foo: 'bar' }, origin as string);

      expect(injectJavaScript).not.toHaveBeenCalled();
    },
  );
});
