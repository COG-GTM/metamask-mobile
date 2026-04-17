import { toDataUrl } from './blockies';

describe('blockies', () => {
  it('exports toDataUrl function', () => {
    expect(typeof toDataUrl).toBe('function');
  });

  it('generates a data URL for an address', () => {
    const result = toDataUrl('0x1234567890abcdef1234567890abcdef12345678');
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('generates consistent results for the same address', () => {
    const address = '0xabcdef1234567890abcdef1234567890abcdef12';
    const result1 = toDataUrl(address);
    const result2 = toDataUrl(address);
    expect(result1).toBe(result2);
  });

  it('generates different results for different addresses', () => {
    const result1 = toDataUrl('0x1111111111111111111111111111111111111111');
    const result2 = toDataUrl('0x2222222222222222222222222222222222222222');
    expect(result1).not.toBe(result2);
  });

  it('handles lowercase addresses', () => {
    const result = toDataUrl('0xabcdef1234567890abcdef1234567890abcdef12');
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('handles mixed case addresses', () => {
    const result = toDataUrl('0xAbCdEf1234567890AbCdEf1234567890AbCdEf12');
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('returns a non-empty base64 string', () => {
    const result = toDataUrl('0x0000000000000000000000000000000000000000');
    const base64Part = result.replace('data:image/png;base64,', '');
    expect(base64Part.length).toBeGreaterThan(0);
  });
});
