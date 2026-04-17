import {
  ActionType,
  disconnectAll,
  updateWC2Metadata,
  updateConnection,
  removeConnection,
  addConnection,
  resetConnections,
  removeApprovedHost,
  setApprovedHost,
  resetApprovedHosts,
  updateDappConnection,
  removeDappConnection,
  resetDappConnections,
  setConnected,
} from './index';

describe('SDK action creators', () => {
  it('disconnectAll creates correct action', () => {
    expect(disconnectAll()).toEqual({ type: ActionType.DISCONNECT_ALL });
  });

  it('updateWC2Metadata creates correct action', () => {
    const metadata = { id: 1, url: 'https://test.com' } as any;
    expect(updateWC2Metadata(metadata)).toEqual({
      type: ActionType.WC2_METADATA,
      metadata,
    });
  });

  it('updateConnection creates correct action', () => {
    const connection = { id: 'conn1' } as any;
    expect(updateConnection('ch1', connection)).toEqual({
      type: ActionType.UPDATE_CONNECTION,
      channelId: 'ch1',
      connection,
    });
  });

  it('removeConnection creates correct action', () => {
    expect(removeConnection('ch1')).toEqual({
      type: ActionType.REMOVE_CONNECTION,
      channelId: 'ch1',
    });
  });

  it('addConnection creates correct action', () => {
    const connection = { id: 'conn2' } as any;
    expect(addConnection('ch2', connection)).toEqual({
      type: ActionType.ADD_CONNECTION,
      channelId: 'ch2',
      connection,
    });
  });

  it('resetConnections creates correct action', () => {
    const connections = { ch1: { id: 'conn1' } } as any;
    expect(resetConnections(connections)).toEqual({
      type: ActionType.RESET_CONNECTIONS,
      connections,
    });
  });

  it('removeApprovedHost creates correct action', () => {
    expect(removeApprovedHost('ch1')).toEqual({
      type: ActionType.REMOVE_APPROVED_HOST,
      channelId: 'ch1',
    });
  });

  it('setApprovedHost creates correct action', () => {
    expect(setApprovedHost('ch1', 99999)).toEqual({
      type: ActionType.SET_APPROVED_HOST,
      channelId: 'ch1',
      validUntil: 99999,
    });
  });

  it('resetApprovedHosts creates correct action', () => {
    const hosts = { ch1: 12345 } as any;
    expect(resetApprovedHosts(hosts)).toEqual({
      type: ActionType.RESET_APPROVED_HOSTS,
      approvedHosts: hosts,
    });
  });

  it('updateDappConnection creates correct action', () => {
    const connection = { id: 'dapp1' } as any;
    expect(updateDappConnection('dapp1', connection)).toEqual({
      type: ActionType.UPDATE_DAPP_CONNECTION,
      channelId: 'dapp1',
      connection,
    });
  });

  it('removeDappConnection creates correct action', () => {
    expect(removeDappConnection('dapp1')).toEqual({
      type: ActionType.REMOVE_DAPP_CONNECTION,
      channelId: 'dapp1',
    });
  });

  it('resetDappConnections creates correct action', () => {
    const connections = { dapp1: { id: 'dapp1' } } as any;
    expect(resetDappConnections(connections)).toEqual({
      type: ActionType.RESET_DAPP_CONNECTIONS,
      connections,
    });
  });

  it('setConnected creates correct action', () => {
    expect(setConnected('ch1', true)).toEqual({
      type: ActionType.SET_CONNECTED,
      channelId: 'ch1',
      connected: true,
    });
  });
});

describe('ActionType enum', () => {
  it('has all expected values', () => {
    expect(ActionType.WC2_METADATA).toBe('WC2_METADATA');
    expect(ActionType.RESET_CONNECTIONS).toBe('RESET_CONNECTIONS');
    expect(ActionType.UPDATE_CONNECTION).toBe('UPDATE_CONNECTION');
    expect(ActionType.REMOVE_CONNECTION).toBe('REMOVE_CONNECTION');
    expect(ActionType.ADD_CONNECTION).toBe('ADD_CONNECTION');
    expect(ActionType.DISCONNECT_ALL).toBe('DISCONNECT_ALL');
    expect(ActionType.REMOVE_APPROVED_HOST).toBe('REMOVE_APPROVWED_HOST');
    expect(ActionType.SET_APPROVED_HOST).toBe('SET_APPROVED_HOST');
    expect(ActionType.RESET_APPROVED_HOSTS).toBe('RESET_APPROVED_HOSTS');
    expect(ActionType.SET_CONNECTED).toBe('SET_CONNECTED');
    expect(ActionType.UPDATE_DAPP_CONNECTION).toBe('UPDATE_DAPP_CONNECTION');
    expect(ActionType.REMOVE_DAPP_CONNECTION).toBe('REMOVE_DAPP_CONNECTION');
    expect(ActionType.RESET_DAPP_CONNECTIONS).toBe('RESET_DAPP_CONNECTIONS');
  });
});
