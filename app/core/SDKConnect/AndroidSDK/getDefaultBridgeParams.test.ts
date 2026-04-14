jest.mock('../../AppConstants', () => ({
  __esModule: true,
  default: {
    MM_SDK: {
      UNKNOWN_PARAM: 'unknown',
    },
  },
}));

jest.mock('../../RPCMethods/RPCMethodMiddleware', () => jest.fn());

import getDefaultBridgeParams from './getDefaultBridgeParams';

describe('getDefaultBridgeParams', () => {
  it('should return bridge params with correct structure', () => {
    const clientInfo = {
      clientId: 'test-client',
      originatorInfo: {
        url: 'https://example.com',
        title: 'Example DApp',
        icon: 'icon.png',
        platform: 'web',
      },
    } as any;

    const result = getDefaultBridgeParams(clientInfo);

    expect(result).toHaveProperty('getApprovedHosts');
    expect(result).toHaveProperty('remoteConnHost', 'https://example.com');
    expect(result).toHaveProperty('getRpcMethodMiddleware');
    expect(result).toHaveProperty('isMainFrame', true);
    expect(result).toHaveProperty('isWalletConnect', false);
    expect(result).toHaveProperty('wcRequestActions', undefined);
  });

  it('getApprovedHosts should return approved host object', () => {
    const clientInfo = {
      clientId: 'test-client',
      originatorInfo: {
        url: 'https://example.com',
        title: 'Example DApp',
      },
    } as any;

    const result = getDefaultBridgeParams(clientInfo);
    const approved = result.getApprovedHosts('example.com');
    expect(approved).toEqual({ 'example.com': true });
  });
});
