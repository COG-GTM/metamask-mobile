import {
  generateUniversalLinkAddress,
  generateUniversalLinkRequest,
  generateETHLink,
  generateERC20Link,
} from './payment-link-generator';

const RECEIVER = '0x1234567890123456789012345678901234567890';
const ASSET = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

describe('payment-link-generator', () => {
  it('generates a universal link for an address', () => {
    expect(generateUniversalLinkAddress(RECEIVER)).toBe(
      `https://metamask.app.link/send/${RECEIVER}`,
    );
  });

  it('converts an ethereum link to a universal link', () => {
    expect(
      generateUniversalLinkRequest(`ethereum:${RECEIVER}@1?value=1e18`),
    ).toBe(`https://metamask.app.link/send/${RECEIVER}@1?value=1e18`);
  });

  it('generates an ETH payment request link', () => {
    expect(generateETHLink(RECEIVER, '1e18', '0x1')).toBe(
      `ethereum:${RECEIVER}@1?value=1e18`,
    );
  });

  it('generates an ERC20 payment request link', () => {
    expect(generateERC20Link(RECEIVER, ASSET, '1e18', '0x89')).toBe(
      `ethereum:${ASSET}@137/transfer?address=${RECEIVER}&uint256=1e18`,
    );
  });
});
