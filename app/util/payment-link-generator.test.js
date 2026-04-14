import { generateUniversalLinkAddress, generateUniversalLinkRequest } from './payment-link-generator';

jest.mock('../core/AppConstants', () => ({
  __esModule: true,
  default: {
    MM_UNIVERSAL_LINK_HOST: 'metamask.app.link',
  },
}));

describe('payment-link-generator', () => {
  describe('generateUniversalLinkAddress', () => {
    it('should generate a universal link with the address', () => {
      const result = generateUniversalLinkAddress('0x1234');
      expect(result).toBe('https://metamask.app.link/send/0x1234');
    });
  });

  describe('generateUniversalLinkRequest', () => {
    it('should replace ethereum: with universal link format', () => {
      const result = generateUniversalLinkRequest('ethereum:0x1234');
      expect(result).toBe('https://metamask.app.link/send/0x1234');
    });
  });
});
