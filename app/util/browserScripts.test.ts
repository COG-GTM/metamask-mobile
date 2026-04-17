import {
  SPA_urlChangeListener,
  JS_WINDOW_INFORMATION,
  JS_DESELECT_TEXT,
  JS_POST_MESSAGE_TO_PROVIDER,
  JS_IFRAME_POST_MESSAGE_TO_PROVIDER,
} from './browserScripts';

describe('browserScripts', () => {
  it('SPA_urlChangeListener is a string containing IIFE', () => {
    expect(typeof SPA_urlChangeListener).toBe('string');
    expect(SPA_urlChangeListener).toContain('pushState');
    expect(SPA_urlChangeListener).toContain('replaceState');
    expect(SPA_urlChangeListener).toContain('NAV_CHANGE');
  });

  it('JS_WINDOW_INFORMATION is a string containing window info script', () => {
    expect(typeof JS_WINDOW_INFORMATION).toBe('string');
    expect(JS_WINDOW_INFORMATION).toContain('GET_TITLE_FOR_BOOKMARK');
  });

  it('JS_DESELECT_TEXT is a string for deselecting text', () => {
    expect(typeof JS_DESELECT_TEXT).toBe('string');
    expect(JS_DESELECT_TEXT).toContain('getSelection');
  });

  it('JS_POST_MESSAGE_TO_PROVIDER returns script string', () => {
    const result = JS_POST_MESSAGE_TO_PROVIDER({ type: 'test' }, 'https://example.com');
    expect(typeof result).toBe('string');
    expect(result).toContain('postMessage');
    expect(result).toContain('test');
    expect(result).toContain('https://example.com');
  });

  it('JS_IFRAME_POST_MESSAGE_TO_PROVIDER returns empty IIFE', () => {
    const result = JS_IFRAME_POST_MESSAGE_TO_PROVIDER({ type: 'test' }, 'https://example.com');
    expect(typeof result).toBe('string');
  });
});
