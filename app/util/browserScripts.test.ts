import {
  JS_POST_MESSAGE_TO_PROVIDER,
  JS_IFRAME_POST_MESSAGE_TO_PROVIDER,
  isValidPostMessageOrigin,
} from './browserScripts';

const MALICIOUS_ORIGIN = "https://x');alert(1);('";

const runInjectedScript = (script: string) => {
  const postMessage = jest.fn();
  const alertSpy = jest.fn();
  // eslint-disable-next-line no-new-func
  new Function('window', 'alert', script)({ postMessage }, alertSpy);
  return { postMessage, alertSpy };
};

describe('browserScripts', () => {
  describe('JS_POST_MESSAGE_TO_PROVIDER', () => {
    it('posts the message to the given origin', () => {
      const message = { name: 'metamask-provider', data: { id: 1 } };
      const { postMessage } = runInjectedScript(
        JS_POST_MESSAGE_TO_PROVIDER(message, 'https://app.uniswap.org'),
      );

      expect(postMessage).toHaveBeenCalledTimes(1);
      expect(postMessage).toHaveBeenCalledWith(
        message,
        'https://app.uniswap.org',
      );
    });

    it('encodes a quote in the origin as data instead of code', () => {
      const script = JS_POST_MESSAGE_TO_PROVIDER({}, MALICIOUS_ORIGIN);

      expect(script).toContain(
        `window.postMessage({}, ${JSON.stringify(MALICIOUS_ORIGIN)});`,
      );

      const { postMessage, alertSpy } = runInjectedScript(script);
      expect(alertSpy).not.toHaveBeenCalled();
      expect(postMessage).toHaveBeenCalledTimes(1);
      expect(postMessage).toHaveBeenCalledWith({}, MALICIOUS_ORIGIN);
    });

    it('does not let a script-closing sequence in the origin execute', () => {
      const origin = "https://x\\');alert(2);//";
      const { postMessage, alertSpy } = runInjectedScript(
        JS_POST_MESSAGE_TO_PROVIDER({}, origin),
      );
      expect(alertSpy).not.toHaveBeenCalled();
      expect(postMessage).toHaveBeenCalledWith({}, origin);
    });
  });

  describe('JS_IFRAME_POST_MESSAGE_TO_PROVIDER', () => {
    it('does not embed the origin', () => {
      expect(
        JS_IFRAME_POST_MESSAGE_TO_PROVIDER({}, MALICIOUS_ORIGIN),
      ).not.toContain('alert');
    });
  });

  describe('isValidPostMessageOrigin', () => {
    it.each([
      'https://app.uniswap.org',
      'http://localhost:3000',
      'https://portfolio.metamask.io',
      'http://192.168.0.1:8545',
      'http://[::1]:8080',
      'https://xn--mnchen-3ya.de',
      'https://münchen.de',
    ])('accepts %s', (origin) => {
      expect(isValidPostMessageOrigin(origin)).toBe(true);
    });

    it.each([
      MALICIOUS_ORIGIN,
      "https://x');import(location.pathname.at(0)+'evil.tld');('",
      'https://x%27);alert(1);(%27',
      'https://a"b.com',
      'https://a b.com',
      'https://example.com/path',
      'https://user@example.com',
      'https://example.com:80;alert(1)',
      'null',
      '*',
      '',
      undefined,
      null,
      42,
    ])('rejects %p', (origin) => {
      expect(isValidPostMessageOrigin(origin)).toBe(false);
    });
  });
});
