import DeeplinkManager from '../DeeplinkManager';
import extractURLParams from './extractURLParams';
import handleDappUrl from './handleDappUrl';
import handleMetaMaskDeeplink from './handleMetaMaskDeeplink';
import handleUniversalLink from './handleUniversalLink';
import connectWithWC from './connectWithWC';
import Logger from '../../../util/Logger';
import parseDeeplink, { isValidPrivateKey } from './parseDeeplink';

jest.mock('../../../constants/deeplinks');
jest.mock('../../../util/Logger');
jest.mock('../DeeplinkManager');
jest.mock('../../SDKConnect/utils/DevLogger');
jest.mock('./handleDappUrl');
jest.mock('./handleMetaMaskDeeplink');
jest.mock('./handleUniversalLink');
jest.mock('./connectWithWC');
jest.mock('../../../../locales/i18n', () => ({
  strings: jest.fn((key) => key),
}));

const invalidUrls = [
  'htp://incorrect-format-url',
  'http://',
  ':invalid-protocol://some-url',
  '',
  'https://?!&%5E#@()*]',
];

describe('parseDeeplink', () => {
  let instance: DeeplinkManager;
  const mockOnHandled = jest.fn();
  const mockBrowserCallBack = jest.fn();

  const mockHandleUniversalLinks = handleUniversalLink as jest.MockedFunction<
    typeof handleUniversalLink
  >;

  const mockHandleWCProtocol = connectWithWC as jest.MockedFunction<
    typeof connectWithWC
  >;

  const mockHandleDappProtocol = handleDappUrl as jest.MockedFunction<
    typeof handleDappUrl
  >;

  const mockHandleMetaMaskProtocol =
    handleMetaMaskDeeplink as jest.MockedFunction<
      typeof handleMetaMaskDeeplink
    >;

  beforeEach(() => {
    jest.clearAllMocks();
    instance = {
      _handleEthereumUrl: jest.fn().mockResolvedValue(null),
    } as unknown as DeeplinkManager;
  });

  it('should call handleUniversalLinks for HTTP protocol', () => {
    const url = 'http://example.com/';
    const browserCallBackMock = jest.fn();
    const onHandledMock = jest.fn();

    const { urlObj, params } = extractURLParams(url);

    parseDeeplink({
      deeplinkManager: instance,
      url,
      origin: 'testOrigin',
      browserCallBack: browserCallBackMock,
      onHandled: onHandledMock,
    });

    expect(mockHandleUniversalLinks).toHaveBeenCalledWith(
      expect.objectContaining({
        instance,
        urlObj,
        params,
        browserCallBack: browserCallBackMock,
        origin: 'testOrigin',
        wcURL: url,
      }),
    );
  });

  it('should call handleUniversalLinks for HTTP and HTTPS protocols', () => {
    const url = 'https://example.com/';
    const browserCallBackMock = jest.fn();
    const onHandledMock = jest.fn();

    const { urlObj, params } = extractURLParams(url);

    parseDeeplink({
      deeplinkManager: instance,
      url,
      origin: 'testOrigin',
      browserCallBack: browserCallBackMock,
      onHandled: onHandledMock,
    });

    expect(mockHandleUniversalLinks).toHaveBeenCalledWith(
      expect.objectContaining({
        instance,
        urlObj,
        params,
        browserCallBack: browserCallBackMock,
        origin: 'testOrigin',
        wcURL: url,
      }),
    );
  });

  it('should call handleWCProtocol for WC protocol', () => {
    const url = 'wc://example.com';

    parseDeeplink({
      deeplinkManager: instance,
      url,
      origin: 'testOrigin',
      browserCallBack: mockBrowserCallBack,
      onHandled: mockOnHandled,
    });

    expect(mockHandleWCProtocol).toHaveBeenCalled();
  });

  it('should handle Ethereum URL', () => {
    const url = 'ethereum://example.com';

    parseDeeplink({
      deeplinkManager: instance,
      url,
      origin: 'testOrigin',
      browserCallBack: mockBrowserCallBack,
      onHandled: mockOnHandled,
    });

    expect(instance._handleEthereumUrl).toHaveBeenCalledWith(url, 'testOrigin');
  });

  it('should call handleDappProtocol for DAPP protocol', () => {
    const url = 'dapp://example.com';

    parseDeeplink({
      deeplinkManager: instance,
      url,
      origin: 'testOrigin',
      browserCallBack: mockBrowserCallBack,
      onHandled: mockOnHandled,
    });

    expect(mockHandleDappProtocol).toHaveBeenCalled();
  });

  it('should call handleMetaMaskProtocol for METAMASK protocol', () => {
    const url = 'metamask://example.com';

    parseDeeplink({
      deeplinkManager: instance,
      url,
      origin: 'testOrigin',
      browserCallBack: mockBrowserCallBack,
      onHandled: mockOnHandled,
    });

    expect(mockHandleMetaMaskProtocol).toHaveBeenCalled();
  });

  it('should return false if the protocol is not supported', () => {
    const url = 'unsupported://example.com';

    const result = parseDeeplink({
      deeplinkManager: instance,
      url,
      origin: 'testOrigin',
      browserCallBack: mockBrowserCallBack,
      onHandled: mockOnHandled,
    });

    expect(result).toBe(false);
  });

  it('should return true if the protocol is supported', () => {
    const url = 'http://example.com';

    const result = parseDeeplink({
      deeplinkManager: instance,
      url,
      origin: 'testOrigin',
      browserCallBack: mockBrowserCallBack,
      onHandled: mockOnHandled,
    });

    expect(result).toBe(true);
  });

  describe('isValidPrivateKey', () => {
    const validKey = 'a'.repeat(64);

    it('accepts 64 lowercase hex characters', () => {
      expect(isValidPrivateKey(validKey)).toBe(true);
    });

    it('accepts 64 mixed-case hex characters', () => {
      expect(
        isValidPrivateKey(
          '0123456789abcdefABCDEF0123456789abcdefABCDEF0123456789abcdef0123',
        ),
      ).toBe(true);
    });

    it('accepts a 64 hex character key with a 0x prefix', () => {
      expect(isValidPrivateKey(`0x${validKey}`)).toBe(true);
    });

    it('rejects a 64 character string containing non-hex characters', () => {
      expect(isValidPrivateKey('z'.repeat(64))).toBe(false);
    });

    it('rejects strings of the wrong length', () => {
      expect(isValidPrivateKey('a'.repeat(63))).toBe(false);
      expect(isValidPrivateKey('a'.repeat(65))).toBe(false);
    });
  });

  describe('private key handling in the catch block', () => {
    it('does not log or alert when the value is a valid hex private key (no 0x)', () => {
      const privateKey = 'a'.repeat(64);

      const result = parseDeeplink({
        deeplinkManager: instance,
        url: privateKey,
        origin: 'testOrigin',
        browserCallBack: mockBrowserCallBack,
        onHandled: mockOnHandled,
      });

      expect(result).toBe(false);
      expect(Logger.error).not.toHaveBeenCalled();
    });

    it('does not log the raw value when the key has a 0x prefix', () => {
      const privateKey = `0x${'b'.repeat(64)}`;

      const result = parseDeeplink({
        deeplinkManager: instance,
        url: privateKey,
        origin: 'testOrigin',
        browserCallBack: mockBrowserCallBack,
        onHandled: mockOnHandled,
      });

      expect(result).toBe(false);
      expect(Logger.error).not.toHaveBeenCalled();
    });

    it('treats a 64 char non-hex string as an invalid URL (logs + does not suppress)', () => {
      const notAKey = 'z'.repeat(64);

      const result = parseDeeplink({
        deeplinkManager: instance,
        url: notAKey,
        origin: 'testOrigin',
        browserCallBack: mockBrowserCallBack,
        onHandled: mockOnHandled,
      });

      expect(result).toBe(false);
      expect(Logger.error).toHaveBeenCalled();
    });

    it('never passes the raw private key value to Logger', () => {
      const privateKey = 'c'.repeat(64);

      parseDeeplink({
        deeplinkManager: instance,
        url: privateKey,
        origin: 'testOrigin',
        browserCallBack: mockBrowserCallBack,
        onHandled: mockOnHandled,
      });

      const loggerCalls = [
        ...(Logger.error as jest.Mock).mock.calls,
        ...(Logger.log as jest.Mock).mock.calls,
      ];
      const serialized = JSON.stringify(loggerCalls);
      expect(serialized).not.toContain(privateKey);
    });
  });

  invalidUrls.forEach((url) => {
    it(`should log an error and alert the user when an invalid URL is passed => url=${url}`, () => {
      const result = parseDeeplink({
        deeplinkManager: instance,
        url,
        origin: 'testOrigin',
        browserCallBack: mockBrowserCallBack,
        onHandled: mockOnHandled,
      });

      expect(result).toBe(false);
    });
  });
});
