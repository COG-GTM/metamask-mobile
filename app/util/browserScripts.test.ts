import {
  JS_DESELECT_TEXT,
  JS_IFRAME_POST_MESSAGE_TO_PROVIDER,
  JS_POST_MESSAGE_TO_PROVIDER,
  JS_WINDOW_INFORMATION,
  SPA_urlChangeListener,
} from './browserScripts';

describe('browserScripts', () => {
  it('builds a provider post message script', () => {
    const script = JS_POST_MESSAGE_TO_PROVIDER(
      { method: 'eth_accounts' },
      'https://metamask.io',
    );
    expect(script).toContain(
      `window.postMessage({"method":"eth_accounts"}, 'https://metamask.io');`,
    );
  });

  it('returns a no-op iframe post message script', () => {
    expect(JS_IFRAME_POST_MESSAGE_TO_PROVIDER({}, 'https://metamask.io')).toBe(
      '(function () {})()',
    );
  });

  it('exports the static browser scripts', () => {
    expect(JS_WINDOW_INFORMATION).toContain('GET_TITLE_FOR_BOOKMARK');
    expect(SPA_urlChangeListener).toContain('NAV_CHANGE');
    expect(JS_DESELECT_TEXT).toContain('removeAllRanges');
  });
});
