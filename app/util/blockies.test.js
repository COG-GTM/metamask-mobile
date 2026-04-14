import { toDataUrl } from './blockies';

describe('blockies', () => {
  it('should generate a data URL for a valid address', () => {
    const result = toDataUrl('0x1234567890abcdef1234567890abcdef12345678');
    expect(result).toContain('data:image/png;base64,');
  });

  it('should return cached result for same address', () => {
    const address = '0xabcdef1234567890abcdef1234567890abcdef12';
    const first = toDataUrl(address);
    const second = toDataUrl(address);
    expect(first).toBe(second);
  });

  it('should generate different URLs for different addresses', () => {
    const result1 = toDataUrl('0x1111111111111111111111111111111111111111');
    const result2 = toDataUrl('0x2222222222222222222222222222222222222222');
    expect(result1).not.toBe(result2);
  });
});
