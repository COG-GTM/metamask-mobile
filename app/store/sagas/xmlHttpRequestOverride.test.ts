import {
  overrideXMLHttpRequest,
  restoreXMLHttpRequest,
  shouldBlockRequest,
} from './xmlHttpRequestOverride';

const blockedURLs = [
  'https://security-alerts.api.cx.metamask.io/validate/0x1',
  'https://tokens.api.cx.metamask.io/v3/assets',
  'https://signature-insights.api.cx.metamask.io/v1/signature',
  'https://client-config.api.cx.metamask.io/v1/flags',
  'https://accounts.api.cx.metamask.io/v2/accounts',
  'https://on-ramp.dev-api.cx.metamask.io/regions',
  'https://token.api.cx.metamask.io/tokens/1',
  'https://price.api.cx.metamask.io/v2/chains/1/spot-prices',
  'https://gas.api.cx.metamask.io/networks/1/suggestedGasFees',
  'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0.png',
  'https://config-api.metamask.io/featureFlags',
  'https://mainnet.infura.io/v3/abc',
  'https://infura.io/',
  'https://gas-api.metaswap.codefi.network/networks/1/gasPrices',
  'https://static.metafi.codefi.network/api/v1/tokenIcons/1/0x0.png',
  'https://phishing-detection.example.com/v1/stalelist',
  'https://dapp-scanning.example.com/',
  'HTTPS://Security-Alerts.API.CX.MetaMask.IO/validate/0x1',
  'https://SECURITY-ALERTS.api.cx.metamask.io./validate/0x1',
  'https://user:pass@security-alerts.api.cx.metamask.io/validate/0x1',
  'not a url',
];
const notBlockedURLs = [
  'https://proxy.metafi.codefi.network/opensea/api/v2',
  'https://gateway.pinata.cloud/',
  'https://api.etherscan.io/',
  'https://api2.branch.io/',
  'https://cdn.branch.io/',
  'https://rpc.tenderly.co/',
  'https://example.com/my-api?foo=bar',
  'https://mainnnet.infura.test',
  'https://example.com/search?term=gasapi',
  'https://example.com/search?domain=infura.test',
  'https://example.com/tokenapi?foo=bar',
  'https://example.com/search?term=gas-api',
  'https://example.com/search?domain=infura.io',
  'https://infura.io.test',
  'https://notinfura.io/',
  'https://cx.metamask.io.example.com/',
];

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('shouldBlockRequest', () => {
  blockedURLs.forEach((url) =>
    it(`blocks ${url}`, () => {
      expect(shouldBlockRequest(url)).toBe(true);
    }),
  );

  notBlockedURLs.forEach((url) =>
    it(`does not block ${url}`, () => {
      expect(shouldBlockRequest(url)).toBe(false);
    }),
  );
});

describe('overrideXMLHttpRequest', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    restoreXMLHttpRequest();
  });

  blockedURLs.forEach((url) =>
    it(`blocks requests to blocked URL ${url} when enabled`, async () => {
      const logSpy = jest.spyOn(console, 'error').mockImplementation();
      overrideXMLHttpRequest();
      const req = new global.XMLHttpRequest();
      const onload = jest.fn();
      const onerror = jest.fn();
      req.onload = onload;
      req.onerror = onerror;
      req.open('POST', url);
      req.send('{"foo": "bar"}');
      await flush();
      expect(logSpy.mock.calls[0][0].message).toBe(`Disallowed URL: ${url}`);
      expect(onerror).toHaveBeenCalledTimes(1);
      expect(onload).not.toHaveBeenCalled();
    }),
  );

  notBlockedURLs.forEach((url) =>
    it(`does not block requests to non blocked URL ${url} when enabled`, (done) => {
      const logSpy = jest.spyOn(console, 'error');
      overrideXMLHttpRequest();
      const req = new global.XMLHttpRequest();
      req.onload = () => {
        expect(logSpy.mock.calls.length).toBe(0);
        done();
      };
      req.open('POST', url);
      req.send('{"foo": "bar"}');
    }),
  );

  it('checks the URL of the request being sent when requests are interleaved', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    overrideXMLHttpRequest();
    const blocked = new global.XMLHttpRequest();
    const allowed = new global.XMLHttpRequest();
    const blockedOnload = jest.fn();
    const allowedOnload = jest.fn();
    blocked.onload = blockedOnload;
    allowed.onload = allowedOnload;

    blocked.open(
      'POST',
      'https://security-alerts.api.cx.metamask.io/validate/0x1',
    );
    allowed.open('GET', 'https://api.etherscan.io/');
    blocked.send('{}');
    allowed.send();
    await flush();

    expect(blockedOnload).not.toHaveBeenCalled();
    expect(allowedOnload).toHaveBeenCalledTimes(1);
  });

  it('rejects a fetch to the security alerts API', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    const originalFetch = global.fetch;
    const originalSetRequestHeader =
      global.XMLHttpRequest.prototype.setRequestHeader;
    // React Native `fetch` is the whatwg-fetch polyfill (a react-native dependency) over XMLHttpRequest
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, import/no-extraneous-dependencies
    global.fetch = require('whatwg-fetch').fetch;
    global.XMLHttpRequest.prototype.setRequestHeader = jest.fn();
    overrideXMLHttpRequest();
    try {
      await expect(
        fetch('https://security-alerts.api.cx.metamask.io/validate/0x1', {
          method: 'POST',
          body: JSON.stringify({
            method: 'eth_sendTransaction',
            params: [{ from: '0x1', to: '0x2' }],
          }),
          headers: { 'Content-Type': 'application/json' },
        }),
      ).rejects.toThrow('Network request failed');
    } finally {
      global.fetch = originalFetch;
      global.XMLHttpRequest.prototype.setRequestHeader =
        originalSetRequestHeader;
    }
  });
});

describe('restoreXMLHttpRequest', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  blockedURLs.forEach((url) =>
    it(`does not block requests to blocked URL ${url} when disabled`, (done) => {
      const logSpy = jest.spyOn(console, 'error');
      overrideXMLHttpRequest();
      restoreXMLHttpRequest();
      const req = new global.XMLHttpRequest();
      req.onload = () => {
        expect(logSpy.mock.calls.length).toBe(0);
        done();
      };
      req.open('POST', url);
      req.send('{"foo": "bar"}');
    }),
  );
});
