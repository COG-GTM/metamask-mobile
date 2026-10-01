import qs from 'qs';
import { Alert } from 'react-native';
import UrlParser from 'url-parse';
import { strings } from '../../../../locales/i18n';
import { PROTOCOLS } from '../../../constants/deeplinks';
import Logger from '../../../util/Logger';
import extractURLParams from './extractURLParams';

jest.mock('qs', () => ({
  parse: jest.fn(),
}));

jest.mock('url-parse', () => {
  const mockUrlParser = jest.fn();

  return {
    __esModule: true,
    default: mockUrlParser,
  };
});

jest.mock('../../../util/Logger', () => ({
  __esModule: true,
  default: { log: jest.fn(), error: jest.fn() },
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('extractURLParams', () => {
  const mockUrlParser = UrlParser as jest.MockedClass<typeof UrlParser>;
  const mockQs = qs as jest.Mocked<typeof qs>;

  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should correctly extract parameters from a valid URL with query parameters', () => {
    const url = `${PROTOCOLS.DAPP}/https://example.com?uri=test&redirect=true&channelId=123&comm=test&pubkey=abc&v=2`;
    const expectedParams = {
      uri: 'test',
      redirect: 'true',
      originatorInfo: '',
      rpc: '',
      sdkVersion: '',
      channelId: '123',
      comm: 'test',
      v: '2',
      attributionId: '',
      utm: '',
    };

    mockUrlParser.mockImplementation(
      () =>
        ({
          query:
            '?uri=test&redirect=true&channelId=123&comm=test&pubkey=abc&v=2',
        } as unknown as UrlParser<string>),
    );

    mockQs.parse.mockReturnValue(expectedParams);

    const { params } = extractURLParams(url);

    expect(params).toEqual(expectedParams);
  });

  it('should return an empty params object when the URL has no query parameters', () => {
    const url = `${PROTOCOLS.DAPP}/https://example.com`;

    mockUrlParser.mockImplementation(
      () =>
        ({
          query: '',
        } as unknown as UrlParser<string>),
    );

    const { params } = extractURLParams(url);

    expect(params).toEqual({
      uri: '',
      redirect: '',
      originatorInfo: '',
      rpc: '',
      sdkVersion: '',
      channelId: '',
      comm: '',
      pubkey: '',
      v: '',
      attributionId: '',
      utm: '',
    });
  });

  it('should handle invalid query parameters and show an alert when parsing fails', () => {
    const url = `${PROTOCOLS.DAPP}/https://example.com?invalid=param`;
    const errorMessage = 'Invalid query parameter';

    mockUrlParser.mockImplementation(
      () =>
        ({
          query: '?invalid=param',
        } as unknown as UrlParser<string>),
    );

    mockQs.parse.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const alertSpy = jest.spyOn(Alert, 'alert');

    const { params } = extractURLParams(url);

    expect(params).toEqual({
      uri: '',
      redirect: '',
      originatorInfo: '',
      rpc: '',
      sdkVersion: '',
      channelId: '',
      comm: '',
      pubkey: '',
      v: '',
      attributionId: '',
      utm: '',
    });

    expect(alertSpy).toHaveBeenCalledWith(
      strings('deeplink.invalid'),
      'Error: ' + errorMessage,
    );
  });

  it('should correctly parse and extract parameters from a URL with valid query parameters', () => {
    const url = `${PROTOCOLS.DAPP}/https://example.com?uri=test&redirect=false&channelId=456&comm=other&pubkey=xyz`;
    const expectedParams = {
      uri: 'test',
      redirect: 'false',
      channelId: '456',
      comm: 'other',
      v: '',
      originatorInfo: '',
      rpc: '',
      sdkVersion: '',
      pubkey: 'xyz',
      attributionId: '',
      utm: '',
    };

    mockUrlParser.mockImplementation(
      () =>
        ({
          query: '?uri=test&redirect=false&channelId=456&comm=other&pubkey=xyz',
        } as unknown as UrlParser<string>),
    );

    mockQs.parse.mockReturnValue(expectedParams);

    const { params } = extractURLParams(url);

    expect(params).toEqual(expectedParams);
  });

  it('restores + in the SDK message param without logging its content', () => {
    const url = `${PROTOCOLS.DAPP}/https://example.com?channelId=123&message=abc def`;
    const secret = 'c2VjcmV0 cGF5bG9hZA==';

    mockUrlParser.mockImplementation(
      () =>
        ({
          query: `?channelId=123&message=${secret}`,
        } as unknown as UrlParser<string>),
    );

    mockQs.parse.mockReturnValue({ channelId: '123', message: secret });

    const { params } = extractURLParams(url);

    expect(params.message).toBe('c2VjcmV0+cGF5bG9hZA==');
    expect(Logger.log).not.toHaveBeenCalled();
  });
});
