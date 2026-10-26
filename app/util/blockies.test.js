import { toDataUrl } from './blockies';

describe('blockies', () => {
  it('generates a base64 PNG data URL', () => {
    const result = toDataUrl('0x1234567890abcdef1234567890abcdef12345678');
    expect(result.startsWith('data:image/png;base64,iVBORw0KGgo')).toBe(true);
  });

  it('is deterministic and case insensitive', () => {
    const address = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
    const first = toDataUrl(address);
    expect(toDataUrl(address)).toBe(first);
    expect(toDataUrl(address.toLowerCase())).toBe(first);
  });

  it('generates different images for different addresses', () => {
    expect(toDataUrl('0x0000000000000000000000000000000000000001')).not.toBe(
      toDataUrl('0x0000000000000000000000000000000000000002'),
    );
  });

  it('throws when no seed is provided', () => {
    expect(() => toDataUrl('')).toThrow('No seed provided');
  });
});
