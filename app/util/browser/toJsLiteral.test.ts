import toJsLiteral from './toJsLiteral';

describe('toJsLiteral', () => {
  it('serializes strings as quoted literals', () => {
    expect(toJsLiteral('https://example.com')).toBe('"https://example.com"');
  });

  it('escapes quotes so a value cannot break out of its literal', () => {
    const malicious = "https://evil.xyz/#';alert(document.cookie);//";
    const literal = toJsLiteral(malicious);
    // eslint-disable-next-line no-eval
    expect(eval(literal)).toBe(malicious);
    expect(literal).not.toContain("';");
  });

  it('escapes line and paragraph separators', () => {
    expect(toJsLiteral('a\u2028b\u2029c')).toBe('"a\\u2028b\\u2029c"');
  });

  it('escapes angle brackets and ampersands', () => {
    expect(toJsLiteral('</script><img src=x>&')).toBe(
      '"\\u003c/script\\u003e\\u003cimg src=x\\u003e\\u0026"',
    );
  });

  it('serializes objects and preserves their value', () => {
    const message = { data: { result: "'+alert(1)+'" }, name: 'provider' };
    // eslint-disable-next-line no-eval
    expect(eval(`(${toJsLiteral(message)})`)).toStrictEqual(message);
  });

  it('handles booleans, null and undefined', () => {
    expect(toJsLiteral(true)).toBe('true');
    expect(toJsLiteral(null)).toBe('null');
    expect(toJsLiteral(undefined)).toBe('undefined');
  });
});
