import connectWithWC from './connectWithWC';
import WC2Manager from '../../WalletConnect/WalletConnectV2';

jest.mock('../../../core/WalletConnect/WalletConnectV2');
jest.mock('./extractURLParams');

describe('handleWCProtocol', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call handled and connect to WalletConnect with the correct parameters', async () => {
    const handledMock = jest.fn();
    const wcURL = 'wc:test';
    const origin = 'testOrigin';
    const params = { redirect: 'testRedirect' } as Parameters<
      typeof connectWithWC
    >[0]['params'];

    const connectMock = jest.fn().mockResolvedValue(null);
    WC2Manager.getInstance = jest.fn().mockResolvedValue({
      connect: connectMock,
    });

    await connectWithWC({
      handled: handledMock,
      wcURL,
      origin,
      params,
    });

    expect(handledMock).toHaveBeenCalled();
    expect(WC2Manager.getInstance).toHaveBeenCalled();
    expect(connectMock).toHaveBeenCalledWith({
      wcUri: wcURL,
      origin,
      redirectUrl: params.redirect,
    });
  });

  it('drops a non-string redirect parameter', async () => {
    const connectMock = jest.fn().mockResolvedValue(null);
    WC2Manager.getInstance = jest.fn().mockResolvedValue({
      connect: connectMock,
    });

    await connectWithWC({
      handled: jest.fn(),
      wcURL: 'wc:test',
      origin: 'testOrigin',
      params: {
        redirect: ['https://evil.example', 'https://evil2.example'],
      } as unknown as Parameters<typeof connectWithWC>[0]['params'],
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(connectMock).toHaveBeenCalledWith({
      wcUri: 'wc:test',
      origin: 'testOrigin',
      redirectUrl: undefined,
    });
  });
});
