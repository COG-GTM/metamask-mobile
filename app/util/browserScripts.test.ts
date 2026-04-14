import {
  SPA_urlChangeListener,
  JS_WINDOW_INFORMATION,
  JS_DESELECT_TEXT,
  JS_POST_MESSAGE_TO_PROVIDER,
  JS_IFRAME_POST_MESSAGE_TO_PROVIDER,
} from './browserScripts';

describe('browserScripts', () => {
  it('should export SPA_urlChangeListener as a string', () => {
    expect(typeof SPA_urlChangeListener).toBe('string');
    expect(SPA_urlChangeListener).toContain('NAV_CHANGE');
  });

  it('should export JS_WINDOW_INFORMATION as a string', () => {
    expect(typeof JS_WINDOW_INFORMATION).toBe('string');
    expect(JS_WINDOW_INFORMATION).toContain('GET_TITLE_FOR_BOOKMARK');
  });

  it('should export JS_DESELECT_TEXT as a string', () => {
    expect(typeof JS_DESELECT_TEXT).toBe('string');
    expect(JS_DESELECT_TEXT).toContain('getSelection');
  });

  it('JS_POST_MESSAGE_TO_PROVIDER should generate valid JS', () => {
    const result = JS_POST_MESSAGE_TO_PROVIDER({ test: true }, '*');
    expect(typeof result).toBe('string');
    expect(result).toContain('postMessage');
  });

  it('JS_IFRAME_POST_MESSAGE_TO_PROVIDER should return a function string', () => {
    const result = JS_IFRAME_POST_MESSAGE_TO_PROVIDER({ test: true }, '*');
    expect(typeof result).toBe('string');
  });
});
