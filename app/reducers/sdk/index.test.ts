import sdkReducer, { initialState } from '.';
import { ActionType } from '../../actions/sdk';

describe('SDK Reducer', () => {
  const mockConnection = {
    id: 'test',
    origin: 'test-origin',
    connected: true,
  } as any;

  it('should return initial state', () => {
    expect(sdkReducer(undefined, { type: '' } as any)).toStrictEqual(initialState);
  });

  it('should handle WC2_METADATA', () => {
    const metadata = { id: '1', url: 'test' } as any;
    const result = sdkReducer(initialState, {
      type: ActionType.WC2_METADATA,
      metadata,
    } as any);

    expect(result.wc2Metadata).toStrictEqual(metadata);
  });

  it('should handle DISCONNECT_ALL', () => {
    const state = {
      ...initialState,
      connections: { 'ch-1': { ...mockConnection, connected: true } },
    };
    const result = sdkReducer(state, { type: ActionType.DISCONNECT_ALL } as any);

    expect(result.connections['ch-1'].connected).toBe(false);
  });

  it('should handle UPDATE_CONNECTION', () => {
    const result = sdkReducer(initialState, {
      type: ActionType.UPDATE_CONNECTION,
      channelId: 'ch-1',
      connection: mockConnection,
    } as any);

    expect(result.connections['ch-1']).toStrictEqual(mockConnection);
  });

  it('should handle REMOVE_CONNECTION', () => {
    const state = { ...initialState, connections: { 'ch-1': mockConnection, 'ch-2': mockConnection } };
    const result = sdkReducer(state, {
      type: ActionType.REMOVE_CONNECTION,
      channelId: 'ch-1',
    } as any);

    expect(result.connections['ch-1']).toBeUndefined();
    expect(result.connections['ch-2']).toBeDefined();
  });

  it('should handle ADD_CONNECTION', () => {
    const result = sdkReducer(initialState, {
      type: ActionType.ADD_CONNECTION,
      channelId: 'ch-1',
      connection: mockConnection,
    } as any);

    expect(result.connections['ch-1']).toStrictEqual(mockConnection);
  });

  it('should handle RESET_CONNECTIONS', () => {
    const connections = { 'ch-new': mockConnection } as any;
    const result = sdkReducer(initialState, {
      type: ActionType.RESET_CONNECTIONS,
      connections,
    } as any);

    expect(result.connections).toStrictEqual(connections);
  });

  it('should handle SET_CONNECTED', () => {
    const state = { ...initialState, connections: { 'ch-1': mockConnection } };
    const result = sdkReducer(state, {
      type: ActionType.SET_CONNECTED,
      channelId: 'ch-1',
      connected: false,
    } as any);

    expect(result.connections['ch-1'].connected).toBe(false);
  });

  it('should handle SET_CONNECTED for non-existent channel', () => {
    const result = sdkReducer(initialState, {
      type: ActionType.SET_CONNECTED,
      channelId: 'nonexistent',
      connected: true,
    } as any);

    expect(result).toStrictEqual(initialState);
  });

  it('should handle REMOVE_APPROVED_HOST', () => {
    const state = { ...initialState, approvedHosts: { 'ch-1': 999, 'ch-2': 888 } };
    const result = sdkReducer(state, {
      type: ActionType.REMOVE_APPROVED_HOST,
      channelId: 'ch-1',
    } as any);

    expect(result.approvedHosts['ch-1']).toBeUndefined();
    expect(result.approvedHosts['ch-2']).toBe(888);
  });

  it('should handle SET_APPROVED_HOST', () => {
    const result = sdkReducer(initialState, {
      type: ActionType.SET_APPROVED_HOST,
      channelId: 'ch-1',
      validUntil: 9999,
    } as any);

    expect(result.approvedHosts['ch-1']).toBe(9999);
  });

  it('should handle UPDATE_DAPP_CONNECTION', () => {
    const result = sdkReducer(initialState, {
      type: ActionType.UPDATE_DAPP_CONNECTION,
      channelId: 'ch-1',
      connection: mockConnection,
    } as any);

    expect(result.dappConnections['ch-1']).toStrictEqual(mockConnection);
  });

  it('should handle REMOVE_DAPP_CONNECTION', () => {
    const state = { ...initialState, dappConnections: { 'ch-1': mockConnection } };
    const result = sdkReducer(state, {
      type: ActionType.REMOVE_DAPP_CONNECTION,
      channelId: 'ch-1',
    } as any);

    expect(result.dappConnections['ch-1']).toBeUndefined();
  });

  it('should handle RESET_DAPP_CONNECTIONS', () => {
    const connections = { 'ch-new': mockConnection } as any;
    const result = sdkReducer(initialState, {
      type: ActionType.RESET_DAPP_CONNECTIONS,
      connections,
    } as any);

    expect(result.dappConnections).toStrictEqual(connections);
  });

  it('should return state for unknown action', () => {
    expect(sdkReducer(initialState, { type: 'UNKNOWN' } as any)).toStrictEqual(initialState);
  });
});
