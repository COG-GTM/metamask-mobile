import {
  SRP_GUIDE_URL,
  NON_CUSTODIAL_WALLET_URL,
  KEEP_SRP_SAFE_URL,
  LEARN_MORE_URL,
  TOKEN_APPROVAL_SPENDING_CAP,
  CONNECTING_TO_A_DECEPTIVE_SITE,
  CONSENSYS_PRIVACY_POLICY,
  CHAINLIST_URL,
  MAINNET_BLOCK_EXPLORER,
  SEPOLIA_BLOCK_EXPLORER,
  LINEA_MAINNET_BLOCK_EXPLORER,
  MM_PHISH_DETECT_URL,
  FALSE_POSITIVE_REPORT_BASE_URL,
  UTM_SOURCE,
  SEPOLIA_FAUCET,
  ETHEREUM_LOGO,
} from './urls';

describe('URL constants', () => {
  it('SRP_GUIDE_URL is https', () => {
    expect(SRP_GUIDE_URL).toMatch(/^https:\/\//);
  });

  it('NON_CUSTODIAL_WALLET_URL is https', () => {
    expect(NON_CUSTODIAL_WALLET_URL).toMatch(/^https:\/\//);
  });

  it('KEEP_SRP_SAFE_URL is https', () => {
    expect(KEEP_SRP_SAFE_URL).toMatch(/^https:\/\//);
  });

  it('LEARN_MORE_URL is https', () => {
    expect(LEARN_MORE_URL).toMatch(/^https:\/\//);
  });

  it('TOKEN_APPROVAL_SPENDING_CAP is https', () => {
    expect(TOKEN_APPROVAL_SPENDING_CAP).toMatch(/^https:\/\//);
  });

  it('CONNECTING_TO_A_DECEPTIVE_SITE is https', () => {
    expect(CONNECTING_TO_A_DECEPTIVE_SITE).toMatch(/^https:\/\//);
  });

  it('CONSENSYS_PRIVACY_POLICY is https', () => {
    expect(CONSENSYS_PRIVACY_POLICY).toBe('https://consensys.net/privacy-policy/');
  });

  it('CHAINLIST_URL is defined', () => {
    expect(CHAINLIST_URL).toBe('https://chainlist.wtf');
  });

  it('block explorer URLs are defined', () => {
    expect(MAINNET_BLOCK_EXPLORER).toBe('https://etherscan.io');
    expect(SEPOLIA_BLOCK_EXPLORER).toBe('https://sepolia.etherscan.io');
    expect(LINEA_MAINNET_BLOCK_EXPLORER).toBe('https://lineascan.build');
  });

  it('phishing URLs are defined', () => {
    expect(MM_PHISH_DETECT_URL).toContain('github.com');
  });

  it('FALSE_POSITIVE_REPORT_BASE_URL is defined', () => {
    expect(FALSE_POSITIVE_REPORT_BASE_URL).toContain('blockaid');
  });

  it('UTM_SOURCE is metamask-ppom', () => {
    expect(UTM_SOURCE).toBe('metamask-ppom');
  });

  it('faucet URLs are defined', () => {
    expect(SEPOLIA_FAUCET).toContain('infura.io');
  });

  it('ETHEREUM_LOGO is defined', () => {
    expect(ETHEREUM_LOGO).toContain('ethereum');
  });
});
