import {
  escapeForScriptContext,
  safeStringifyForScript,
} from './browserScripts';

describe('escapeForScriptContext', () => {
  it('escapes <, > and & to unicode escape sequences', () => {
    expect(escapeForScriptContext('<>&')).toBe('\\u003C\\u003E\\u0026');
  });

  it('escapes the U+2028 and U+2029 line terminators', () => {
    expect(escapeForScriptContext('a\u2028b\u2029c')).toBe(
      'a\\u2028b\\u2029c',
    );
  });

  it('leaves ordinary characters untouched', () => {
    expect(escapeForScriptContext('hello world 123')).toBe('hello world 123');
  });
});

describe('safeStringifyForScript', () => {
  it('produces JSON that cannot break out of a <script> context', () => {
    const bookmarks = [{ name: '</script><script>alert(1)</script>' }];
    const result = safeStringifyForScript(bookmarks);

    // The literal closing tag must not survive.
    expect(result).not.toContain('</script>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).toContain('\\u003C');
    expect(result).toContain('\\u003E');

    // It still round-trips back to the original value.
    expect(JSON.parse(result)).toEqual(bookmarks);
  });

  it('escapes <, >, & and U+2028/U+2029 in a bookmark-like value', () => {
    const value = { title: 'a<b>c&d\u2028e\u2029f' };
    const result = safeStringifyForScript(value);

    expect(result).not.toMatch(/[<>&\u2028\u2029]/);
    expect(result).toContain('\\u003C');
    expect(result).toContain('\\u003E');
    expect(result).toContain('\\u0026');
    expect(result).toContain('\\u2028');
    expect(result).toContain('\\u2029');
    expect(JSON.parse(result)).toEqual(value);
  });

  it('safely encodes a plain token string', () => {
    const result = safeStringifyForScript('abc&<def>');
    expect(result).toBe('"abc\\u0026\\u003Cdef\\u003E"');
    expect(JSON.parse(result)).toBe('abc&<def>');
  });
});
