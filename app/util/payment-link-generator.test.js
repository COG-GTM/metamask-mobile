import {
  generateUniversalLinkAddress,
  generateUniversalLinkRequest,
} from './payment-link-generator';

describe('payment-link-generator', () => {
  describe('generateUniversalLinkAddress', () => {
    it('generates universal link for address', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const result = generateUniversalLinkAddress(address);
      expect(result).toContain(address);
      expect(result).toMatch(/^https:\/\//);
      expect(result).toContain('/send/');
    });
  });

  describe('generateUniversalLinkRequest', () => {
    it('replaces ethereum: with universal link', () => {
      const ethLink = 'ethereum:0x1234';
      const result = generateUniversalLinkRequest(ethLink);
      expect(result).toMatch(/^https:\/\//);
      expect(result).toContain('/send/');
      expect(result).not.toContain('ethereum:');
    });
  });
});
