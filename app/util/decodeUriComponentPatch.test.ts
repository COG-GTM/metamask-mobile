import { parse, parseUrl } from 'query-string';

// Covers the patch in patches/decode-uri-component+0.2.2.patch, which backports
// the linear-time malformed percent-encoding decoder from decode-uri-component
// 0.5.0 (GHSA-vcc3-ghjq-m6fr / CVE-2026-45822), exercised via query-string.
describe('decode-uri-component patch (via query-string)', () => {
  const decode = (value: string) => parse(`v=${value}`).v;

  it('decodes well-formed input like decodeURIComponent', () => {
    expect(decode('test')).toBe('test');
    expect(decode('a+b%20c')).toBe('a b c');
    expect(decode('%C3%A5')).toBe('å');
    expect(decode('%E2%82%AC')).toBe('€');
    expect(decode('%F0%9F%98%80')).toBe('😀');
  });

  it('decodes as much as possible of malformed input without throwing', () => {
    expect(decode('%')).toBe('%');
    expect(decode('%C3%A5%')).toBe('å%');
    expect(decode('test%C3%A5%')).toBe('testå%');
    expect(decode('%C3%A5%C3%A5%')).toBe('åå%');
    expect(decode('%E0%A4%A')).toBe('%E0%A4%A');
    expect(decode('%E2%82%AC%')).toBe('€%');
    expect(decode('%FE%FF')).toBe('\uFFFD\uFFFD');
    expect(decode('%C2')).toBe('\uFFFD');
    expect(decode('%ab%ab')).toBe('%ab%ab');
  });

  // The unpatched decoder is super-linear in the number of malformed tokens
  // (tens of seconds at ~1400), so these inputs hit Jest's default 5s timeout
  // without needing wall-clock assertions.
  it('decodes long malformed percent-encoded runs without stalling', () => {
    const malformed = '%ab'.repeat(5000);
    expect(decode(malformed)).toBe(malformed);
  });

  it('keeps parseUrl responsive on hostile callback URLs', () => {
    const hostile = `https://example.com/callback?code=${'%ab'.repeat(5000)}`;
    const parsed = parseUrl(hostile);
    expect(parsed.url).toBe('https://example.com/callback');
    expect((parsed.query.code as string).length).toBe(15000);
  });
});
