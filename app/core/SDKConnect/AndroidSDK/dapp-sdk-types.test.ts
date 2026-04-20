import type { OriginatorInfo } from '@metamask/sdk-communication-layer';
import type { DappClient, DappConnections } from './dapp-sdk-types';

describe('dapp-sdk-types', () => {
  it('accepts a minimal DappClient shape', () => {
    const client: DappClient = {
      originatorInfo: {
        url: 'https://dapp.example',
        title: 'Test Dapp',
        platform: 'android',
        dappId: 'dapp-id',
      } as OriginatorInfo,
      clientId: 'client-1',
      connected: true,
    };

    expect(client.clientId).toBe('client-1');
    expect(client.connected).toBe(true);
    expect(client.originatorInfo.title).toBe('Test Dapp');
  });

  it('allows optional validUntil and scheme on DappClient', () => {
    const client: DappClient = {
      originatorInfo: { url: '', title: '' } as OriginatorInfo,
      clientId: 'c',
      connected: false,
      validUntil: 1000,
      scheme: 'metamask',
    };

    expect(client.validUntil).toBe(1000);
    expect(client.scheme).toBe('metamask');
  });

  it('indexes DappConnections by client id', () => {
    const connections: DappConnections = {
      'client-a': {
        originatorInfo: { url: '', title: '' } as OriginatorInfo,
        clientId: 'client-a',
        connected: true,
      },
    };

    expect(Object.keys(connections)).toEqual(['client-a']);
    expect(connections['client-a'].clientId).toBe('client-a');
  });
});
