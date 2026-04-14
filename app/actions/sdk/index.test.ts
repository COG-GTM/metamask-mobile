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
} from '.';

describe('SDK Actions', () => {
  const mockConnection = {
    id: 'test-channel',
    origin: 'test-origin',
  } as any;

  it('disconnectAll should return correct action', () => {
    expect(disconnectAll()).toStrictEqual({
      type: ActionType.DISCONNECT_ALL,
    });
  });

  it('updateWC2Metadata should return correct action', () => {
    const metadata = { id: '1', url: 'test' } as any;

    expect(updateWC2Metadata(metadata)).toStrictEqual({
      type: ActionType.WC2_METADATA,
      metadata,
    });
  });

  it('updateConnection should return correct action', () => {
    expect(updateConnection('channel-1', mockConnection)).toStrictEqual({
      type: ActionType.UPDATE_CONNECTION,
      channelId: 'channel-1',
      connection: mockConnection,
    });
  });

  it('removeConnection should return correct action', () => {
    expect(removeConnection('channel-1')).toStrictEqual({
      type: ActionType.REMOVE_CONNECTION,
      channelId: 'channel-1',
    });
  });

  it('addConnection should return correct action', () => {
    expect(addConnection('channel-1', mockConnection)).toStrictEqual({
      type: ActionType.ADD_CONNECTION,
      channelId: 'channel-1',
      connection: mockConnection,
    });
  });

  it('resetConnections should return correct action', () => {
    const connections = { 'ch-1': mockConnection } as any;

    expect(resetConnections(connections)).toStrictEqual({
      type: ActionType.RESET_CONNECTIONS,
      connections,
    });
  });

  it('removeApprovedHost should return correct action', () => {
    expect(removeApprovedHost('channel-1')).toStrictEqual({
      type: ActionType.REMOVE_APPROVED_HOST,
      channelId: 'channel-1',
    });
  });

  it('setApprovedHost should return correct action', () => {
    expect(setApprovedHost('channel-1', 1234567890)).toStrictEqual({
      type: ActionType.SET_APPROVED_HOST,
      channelId: 'channel-1',
      validUntil: 1234567890,
    });
  });

  it('resetApprovedHosts should return correct action', () => {
    const hosts = { 'ch-1': 999 } as any;

    expect(resetApprovedHosts(hosts)).toStrictEqual({
      type: ActionType.RESET_APPROVED_HOSTS,
      approvedHosts: hosts,
    });
  });

  it('updateDappConnection should return correct action', () => {
    expect(updateDappConnection('channel-1', mockConnection)).toStrictEqual({
      type: ActionType.UPDATE_DAPP_CONNECTION,
      channelId: 'channel-1',
      connection: mockConnection,
    });
  });

  it('removeDappConnection should return correct action', () => {
    expect(removeDappConnection('channel-1')).toStrictEqual({
      type: ActionType.REMOVE_DAPP_CONNECTION,
      channelId: 'channel-1',
    });
  });

  it('resetDappConnections should return correct action', () => {
    const connections = { 'ch-1': mockConnection } as any;

    expect(resetDappConnections(connections)).toStrictEqual({
      type: ActionType.RESET_DAPP_CONNECTIONS,
      connections,
    });
  });

  it('setConnected should return correct action', () => {
    expect(setConnected('channel-1', true)).toStrictEqual({
      type: ActionType.SET_CONNECTED,
      channelId: 'channel-1',
      connected: true,
    });
  });
});
