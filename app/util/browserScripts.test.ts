import {
  SPA_urlChangeListener,
  JS_WINDOW_INFORMATION,
  JS_DESELECT_TEXT,
  JS_POST_MESSAGE_TO_PROVIDER,
  JS_IFRAME_POST_MESSAGE_TO_PROVIDER,
} from './browserScripts';

describe('browserScripts', () => {
  describe('SPA_urlChangeListener', () => {
    it('should be a non-empty string', () => {
      expect(typeof SPA_urlChangeListener).toBe('string');
      expect(SPA_urlChangeListener.length).toBeGreaterThan(0);
    });

    it('should be a self-executing function', () => {
      expect(SPA_urlChangeListener).toContain('(function ()');
    });

    it('should override pushState and replaceState', () => {
      expect(SPA_urlChangeListener).toContain('pushState');
      expect(SPA_urlChangeListener).toContain('replaceState');
    });

    it('should handle popstate events', () => {
      expect(SPA_urlChangeListener).toContain('onpopstate');
    });

    it('should post NAV_CHANGE message', () => {
      expect(SPA_urlChangeListener).toContain('NAV_CHANGE');
    });

    it('should post GET_HEIGHT message', () => {
      expect(SPA_urlChangeListener).toContain('GET_HEIGHT');
    });
  });

  describe('JS_WINDOW_INFORMATION', () => {
    it('should be a non-empty string', () => {
      expect(typeof JS_WINDOW_INFORMATION).toBe('string');
      expect(JS_WINDOW_INFORMATION.length).toBeGreaterThan(0);
    });

    it('should contain GET_TITLE_FOR_BOOKMARK message type', () => {
      expect(JS_WINDOW_INFORMATION).toContain('GET_TITLE_FOR_BOOKMARK');
    });

    it('should be a self-executing function', () => {
      expect(JS_WINDOW_INFORMATION).toContain('(function ()');
    });
  });

  describe('JS_DESELECT_TEXT', () => {
    it('should handle window.getSelection', () => {
      expect(JS_DESELECT_TEXT).toContain('window.getSelection');
    });

    it('should handle document.selection as fallback', () => {
      expect(JS_DESELECT_TEXT).toContain('document.selection');
    });
  });

  describe('JS_POST_MESSAGE_TO_PROVIDER', () => {
    it('should return a string with the message and origin', () => {
      const message = { type: 'test', data: 'hello' };
      const origin = 'https://example.com';
      const result = JS_POST_MESSAGE_TO_PROVIDER(message, origin);

      expect(typeof result).toBe('string');
      expect(result).toContain(JSON.stringify(message));
      expect(result).toContain(origin);
    });

    it('should be a self-executing function', () => {
      const result = JS_POST_MESSAGE_TO_PROVIDER({}, 'https://test.com');
      expect(result).toContain('(function ()');
    });

    it('should call window.postMessage', () => {
      const result = JS_POST_MESSAGE_TO_PROVIDER({}, 'https://test.com');
      expect(result).toContain('window.postMessage');
    });
  });

  describe('JS_IFRAME_POST_MESSAGE_TO_PROVIDER', () => {
    it('should return a self-executing function string', () => {
      const result = JS_IFRAME_POST_MESSAGE_TO_PROVIDER(
        { type: 'test' },
        'https://example.com',
      );
      expect(typeof result).toBe('string');
      expect(result).toContain('(function ()');
    });

    it('should return a no-op function (disabled)', () => {
      const result = JS_IFRAME_POST_MESSAGE_TO_PROVIDER(
        { type: 'test' },
        'https://example.com',
      );
      // The function body should be essentially empty
      expect(result).toBe('(function () {})()');
    });
  });
});
