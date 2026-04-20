import { toDataUrl } from './blockies';

describe('blockies.toDataUrl', () => {
  it('returns a base64 data URL for a given address', () => {
    const url = toDataUrl('0x0000000000000000000000000000000000000001');
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
    expect(url.length).toBeGreaterThan('data:image/png;base64,'.length);
  });

  it('is deterministic for the same input', () => {
    const address = '0x0000000000000000000000000000000000000002';
    expect(toDataUrl(address)).toBe(toDataUrl(address));
  });

  it('produces different output for different addresses', () => {
    const a = toDataUrl('0x0000000000000000000000000000000000000003');
    const b = toDataUrl('0x00000000000000000000000000000000000000ff');
    expect(a).not.toBe(b);
  });

  it('is case-insensitive on the seed (address)', () => {
    const lower = toDataUrl('0xabcdef0123456789abcdef0123456789abcdef01');
    const upper = toDataUrl('0xABCDEF0123456789ABCDEF0123456789ABCDEF01');
    expect(lower).toBe(upper);
  });
});
