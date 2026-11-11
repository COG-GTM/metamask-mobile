import { isPrivateNetworkUrl } from './isPrivateNetworkUrl';

describe('isPrivateNetworkUrl', () => {
  it.each([
    'https://localhost',
    'https://LOCALHOST.:8545',
    'https://foo.localhost',
    'https://router.local',
    'https://node.internal/rpc',
    'https://nas.home.arpa',
    'https://intranet',
    'https://127.0.0.1',
    'https://127.1',
    'https://0177.0.0.1',
    'https://0x7f000001',
    'https://2130706433',
    'https://0.0.0.0',
    'https://10.1.2.3',
    'https://100.64.0.1',
    'https://169.254.169.254/latest/meta-data',
    'https://172.16.0.1',
    'https://172.31.255.255',
    'https://192.168.1.1',
    'https://user:pass@192.168.1.1:8443/path?q=1',
    'https://198.18.0.1',
    'https://224.0.0.1',
    'https://255.255.255.255',
    'https://256.1.1.1',
    'https://127.0.0.1%2e',
    'https://[::1]',
    'https://[::]',
    'https://[::ffff:127.0.0.1]',
    'https://[fe80::1]',
    'https://[fd00::1]:8545',
    'https://[2002:c0a8:101::1]',
    'not a url',
  ])('returns true for %s', (url) => {
    expect(isPrivateNetworkUrl(url)).toBe(true);
  });

  it.each([
    'https://rpc.gnosischain.com',
    'https://mainnet.infura.io/v3/abc',
    'https://user:pass@rpc.example.com/path',
    'https://8.8.8.8',
    'https://172.32.0.1',
    'https://100.128.0.1',
    'https://192.169.0.1',
    'https://1.1.1.1:8545/rpc',
    'https://[2606:4700:4700::1111]',
    'https://xn--80ak6aa92e.com',
  ])('returns false for %s', (url) => {
    expect(isPrivateNetworkUrl(url)).toBe(false);
  });
});
