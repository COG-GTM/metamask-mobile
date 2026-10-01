import SanitizeUrlInput from './sanitizeUrlInput';

describe('sanitizeUrlInput', () => {
  it('should sanitize url passed to the browser', () => {
    const urlString = "https://random.xyz/#'+eval(atob('${btoa(payload)}'))+'";
    const sanitizedUrl = SanitizeUrlInput(urlString);
    // Single quotes are percent-encoded and the `${` template-literal sequence
    // is neutralized so the value cannot break out of an injected JS string.
    expect(sanitizedUrl).toEqual(
      'https://random.xyz/#%27+eval(atob(%27%24%7Bbtoa(payload)}%27))+%27',
    );
  });

  it('should return empty string if input starts with "javascript:"', () => {
    // eslint-disable-next-line no-script-url
    const input = 'javascript:alert("XSS")';
    const output = SanitizeUrlInput(input);
    expect(output).toBe('');
  });

  it('should replace single quote with %27', () => {
    const input = "http://example.com/test'script";
    const output = SanitizeUrlInput(input);
    expect(output).toBe('http://example.com/test%27script');
  });

  it('should remove carriage return and newline characters', () => {
    const input = 'http://example.com/test\r\nscript';
    const output = SanitizeUrlInput(input);
    expect(output).toBe('http://example.com/testscript');
  });

  it('should return the same URL if no special characters are present', () => {
    const input = 'http://example.com/testscript';
    const output = SanitizeUrlInput(input);
    expect(output).toBe(input);
  });

  // Helper: emulate the BrowserTab injection context and assert that the
  // sanitized value cannot terminate the surrounding single-quoted JS string.
  const embedInSingleQuotedString = (value: string) =>
    `window.location.href = '${SanitizeUrlInput(value)}';`;

  const assertNoStringBreakout = (value: string) => {
    const injected = embedInSingleQuotedString(value);
    // Exactly two single quotes remain: the literal delimiters we control.
    const quoteCount = (injected.match(/'/g) || []).length;
    expect(quoteCount).toBe(2);
    // The only quotes are the opening and closing delimiters.
    expect(injected.startsWith("window.location.href = '")).toBe(true);
    expect(injected.endsWith("';")).toBe(true);
    // No raw backslash, newline or template-literal sequence survives.
    expect(SanitizeUrlInput(value)).not.toMatch(/[\\\r\n\u2028\u2029`]/);
    expect(SanitizeUrlInput(value)).not.toContain('${');
  };

  describe('breakout payloads', () => {
    it("neutralizes \"'); alert(1);('\"", () => {
      assertNoStringBreakout("'); alert(1);('");
    });

    it('neutralizes "\'; fetch(...);//"', () => {
      assertNoStringBreakout("'; fetch('//evil');//");
    });

    it('escapes a single backslash followed by a quote (\\\')', () => {
      const output = SanitizeUrlInput("\\'");
      expect(output).toBe('%5C%27');
      assertNoStringBreakout("\\'");
    });

    it('escapes a trailing backslash (\\\\) so it cannot escape the closing quote', () => {
      const output = SanitizeUrlInput('\\');
      expect(output).toBe('%5C');
      assertNoStringBreakout('\\');
    });

    it('escapes double quotes', () => {
      expect(SanitizeUrlInput('a"b')).toBe('a%22b');
    });

    it('strips newline / carriage return', () => {
      expect(SanitizeUrlInput('a\nb\rc')).toBe('abc');
      assertNoStringBreakout('a\nb\rc');
    });

    it('strips the U+2028 and U+2029 line terminators', () => {
      expect(SanitizeUrlInput('a\u2028b\u2029c')).toBe('abc');
      assertNoStringBreakout('a\u2028b\u2029c');
    });

    it('neutralizes template-literal sequences (` and ${)', () => {
      expect(SanitizeUrlInput('`${x}`')).toBe('%60%24%7Bx}%60');
    });

    it('neutralizes </script> breakout sequences', () => {
      expect(SanitizeUrlInput('</script><script>alert(1)')).toBe(
        '%3C/script><script>alert(1)',
      );
    });
  });

  describe('dangerous scheme rejection', () => {
    it('rejects javascript: (lowercase)', () => {
      // eslint-disable-next-line no-script-url
      expect(SanitizeUrlInput('javascript:alert(1)')).toBe('');
    });

    it('rejects JavaScript: (mixed case)', () => {
      // eslint-disable-next-line no-script-url
      expect(SanitizeUrlInput('JavaScript:alert(1)')).toBe('');
    });

    it('rejects data: URLs', () => {
      expect(
        SanitizeUrlInput('data:text/html,<script>alert(1)</script>'),
      ).toBe('');
    });

    it('rejects data: with leading whitespace and control characters', () => {
      expect(SanitizeUrlInput('  \t\ndata:text/html,foo')).toBe('');
    });

    it('rejects javascript: with leading whitespace / control characters', () => {
      // eslint-disable-next-line no-script-url
      expect(SanitizeUrlInput('  \tjavascript:alert(1)')).toBe('');
    });

    it('still allows ordinary https URLs', () => {
      const url = 'https://example.com/path?q=1#frag';
      expect(SanitizeUrlInput(url)).toBe(url);
    });
  });
});
