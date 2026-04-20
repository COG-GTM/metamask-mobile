import AppConstants from '../core/AppConstants';
import {
  generateERC20Link,
  generateETHLink,
  generateUniversalLinkAddress,
  generateUniversalLinkRequest,
} from './payment-link-generator';

describe('payment-link-generator', () => {
  it('generateUniversalLinkAddress builds a send universal link', () => {
    const url = generateUniversalLinkAddress('0xabc');
    expect(url).toBe(
      `https://${AppConstants.MM_UNIVERSAL_LINK_HOST}/send/0xabc`,
    );
  });

  it('generateUniversalLinkRequest swaps the ethereum: scheme', () => {
    const link = generateUniversalLinkRequest('ethereum:0xabc@1?value=1');
    expect(link).toBe(
      `https://${AppConstants.MM_UNIVERSAL_LINK_HOST}/send/0xabc@1?value=1`,
    );
  });

  it('generateETHLink builds an EIP-681 ETH payment link', () => {
    const link = generateETHLink('0xabc', '5', '0x1');
    expect(link).toContain('ethereum:0xabc');
    expect(link).toContain('value=5');
    expect(link).toContain('@1');
  });

  it('generateERC20Link builds an EIP-681 ERC20 transfer link', () => {
    const link = generateERC20Link('0xrecipient', '0xtoken', '5', '0x89');
    expect(link).toContain('ethereum:0xtoken');
    expect(link).toContain('@137/transfer');
    expect(link).toContain('address=0xrecipient');
    expect(link).toContain('uint256=5');
  });
});
