import type { SDKState, WC2Metadata } from './state';

describe('sdk state types', () => {
  it('WC2Metadata can be constructed with required fields', () => {
    const metadata: WC2Metadata = {
      id: 'id-1',
      url: 'https://example.com',
      name: 'Example',
      icon: 'icon.png',
    };
    expect(metadata.id).toBe('id-1');
    expect(metadata.url).toBe('https://example.com');
    expect(metadata.name).toBe('Example');
    expect(metadata.icon).toBe('icon.png');
  });

  it('SDKState can be constructed without optional wc2Metadata', () => {
    const state: SDKState = {
      connections: {},
      approvedHosts: {},
      dappConnections: {},
    };
    expect(state.wc2Metadata).toBeUndefined();
    expect(state.connections).toEqual({});
  });

  it('SDKState can include optional wc2Metadata', () => {
    const state: SDKState = {
      connections: {},
      approvedHosts: {},
      dappConnections: {},
      wc2Metadata: {
        id: '1',
        url: 'https://a.io',
        name: 'a',
        icon: '',
      },
    };
    expect(state.wc2Metadata?.id).toBe('1');
  });
});
