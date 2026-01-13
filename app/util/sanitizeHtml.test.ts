import { escapeHtml, sanitizeCss, sanitizeCssColor } from './sanitizeHtml';

describe('sanitizeHtml', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      );
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("it's")).toBe('it&#039;s');
    });

    it('should return empty string for empty input', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should return empty string for null/undefined', () => {
      expect(escapeHtml(null as unknown as string)).toBe('');
      expect(escapeHtml(undefined as unknown as string)).toBe('');
    });

    it('should handle strings without special characters', () => {
      expect(escapeHtml('hello world')).toBe('hello world');
    });
  });

  describe('sanitizeCss', () => {
    it('should remove script tags', () => {
      expect(sanitizeCss('<script>alert("xss")</script>')).toBe(
        'alert("xss")',
      );
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeCss('background: url(javascript:alert(1))')).toBe(
        'background: url(alert(1))',
      );
    });

    it('should remove expression()', () => {
      expect(sanitizeCss('width: expression(alert(1))')).toBe(
        'width: (alert(1))',
      );
    });

    it('should remove @import', () => {
      expect(sanitizeCss('@import url("evil.css")')).toBe(
        ' url("evil.css")',
      );
    });

    it('should remove behavior:', () => {
      expect(sanitizeCss('behavior: url(evil.htc)')).toBe(' url(evil.htc)');
    });

    it('should remove -moz-binding:', () => {
      expect(sanitizeCss('-moz-binding: url(evil.xml)')).toBe(
        ' url(evil.xml)',
      );
    });

    it('should return empty string for empty input', () => {
      expect(sanitizeCss('')).toBe('');
    });

    it('should return empty string for null/undefined', () => {
      expect(sanitizeCss(null as unknown as string)).toBe('');
      expect(sanitizeCss(undefined as unknown as string)).toBe('');
    });

    it('should allow safe CSS', () => {
      expect(sanitizeCss('color: red; font-size: 14px;')).toBe(
        'color: red; font-size: 14px;',
      );
    });
  });

  describe('sanitizeCssColor', () => {
    it('should allow hex colors', () => {
      expect(sanitizeCssColor('#fff')).toBe('#fff');
      expect(sanitizeCssColor('#ffffff')).toBe('#ffffff');
      expect(sanitizeCssColor('#FFFFFF')).toBe('#FFFFFF');
      expect(sanitizeCssColor('#ffff')).toBe('#ffff');
      expect(sanitizeCssColor('#ffffffff')).toBe('#ffffffff');
    });

    it('should allow rgb colors', () => {
      expect(sanitizeCssColor('rgb(255, 255, 255)')).toBe('rgb(255, 255, 255)');
    });

    it('should allow rgba colors', () => {
      expect(sanitizeCssColor('rgba(255, 255, 255, 0.5)')).toBe(
        'rgba(255, 255, 255, 0.5)',
      );
    });

    it('should allow hsl colors', () => {
      expect(sanitizeCssColor('hsl(120, 100%, 50%)')).toBe(
        'hsl(120, 100%, 50%)',
      );
    });

    it('should allow hsla colors', () => {
      expect(sanitizeCssColor('hsla(120, 100%, 50%, 0.5)')).toBe(
        'hsla(120, 100%, 50%, 0.5)',
      );
    });

    it('should allow named colors', () => {
      expect(sanitizeCssColor('red')).toBe('red');
      expect(sanitizeCssColor('blue')).toBe('blue');
      expect(sanitizeCssColor('transparent')).toBe('transparent');
    });

    it('should return transparent for invalid colors', () => {
      // eslint-disable-next-line no-script-url
      expect(sanitizeCssColor('javascript:alert(1)')).toBe('transparent');
      expect(sanitizeCssColor('<script>alert(1)</script>')).toBe('transparent');
      expect(sanitizeCssColor('expression(alert(1))')).toBe('transparent');
    });

    it('should return transparent for empty input', () => {
      expect(sanitizeCssColor('')).toBe('transparent');
    });

    it('should return transparent for null/undefined', () => {
      expect(sanitizeCssColor(null as unknown as string)).toBe('transparent');
      expect(sanitizeCssColor(undefined as unknown as string)).toBe(
        'transparent',
      );
    });

    it('should trim whitespace', () => {
      expect(sanitizeCssColor('  #fff  ')).toBe('#fff');
    });
  });
});
