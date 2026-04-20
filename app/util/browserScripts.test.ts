import {
  JS_DESELECT_TEXT,
  JS_IFRAME_POST_MESSAGE_TO_PROVIDER,
  JS_POST_MESSAGE_TO_PROVIDER,
  JS_WINDOW_INFORMATION,
  SPA_urlChangeListener,
} from './browserScripts';

describe('browserScripts', () => {
  it('JS_DESELECT_TEXT targets window.getSelection and document.selection', () => {
    expect(JS_DESELECT_TEXT).toContain('window.getSelection');
    expect(JS_DESELECT_TEXT).toContain('document.selection');
  });

  it('JS_WINDOW_INFORMATION references title and icon for bookmarks', () => {
    expect(JS_WINDOW_INFORMATION).toContain('GET_TITLE_FOR_BOOKMARK');
    expect(JS_WINDOW_INFORMATION).toContain('shortcutIcon');
  });

  it('SPA_urlChangeListener hooks pushState/replaceState and popstate', () => {
    expect(SPA_urlChangeListener).toContain('pushState');
    expect(SPA_urlChangeListener).toContain('replaceState');
    expect(SPA_urlChangeListener).toContain('onpopstate');
    expect(SPA_urlChangeListener).toContain('NAV_CHANGE');
  });

  it('JS_POST_MESSAGE_TO_PROVIDER embeds the serialized message and origin', () => {
    const script = JS_POST_MESSAGE_TO_PROVIDER({ a: 1 }, 'https://a.io');
    expect(script).toContain('{"a":1}');
    expect(script).toContain("'https://a.io'");
    expect(script).toContain('window.postMessage');
  });

  it('JS_IFRAME_POST_MESSAGE_TO_PROVIDER is currently a no-op IIFE', () => {
    const script = JS_IFRAME_POST_MESSAGE_TO_PROVIDER({}, 'about:blank');
    expect(script).toBe('(function () {})()');
  });
});
