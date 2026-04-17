import sdkReducer, { initialState } from './index';
import { ActionType } from '../../actions/sdk';

describe('sdkReducer', () => {
  it('should return initial state', () => {
    const state = sdkReducer(undefined, { type: 'UNKNOWN' } as any);
    expect(state).toEqual(initialState);
  });

  it('should handle WC2_METADATA', () => {
    const metadata = { id: 1, url: 'https://test.com' };
    const state = sdkReducer(initialState, {
      type: ActionType.WC2_METADATA,
      metadata,
    } as any);
    expect(state.wc2Metadata).toEqual(metadata);
  });

  it('should handle DISCONNECT_ALL', () => {
    const stateWithConnections = {
      ...initialState,
      connections: {
        ch1: { id: 'ch1', connected: true } as any,
        ch2: { id: 'ch2', connected: true } as any,
      },
    };
    const state = sdkReducer(stateWithConnections, {
      type: ActionType.DISCONNECT_ALL,
    });
    expect(state.connections.ch1.connected).toBe(false);
    expect(state.connections.ch2.connected).toBe(false);
  });

  it('should handle UPDATE_CONNECTION', () => {
    const connection = { id: 'ch1', connected: true } as any;
    const state = sdkReducer(initialState, {
      type: ActionType.UPDATE_CONNECTION,
      channelId: 'ch1',
      connection,
    } as any);
    expect(state.connections.ch1).toEqual(connection);
  });

  it('should handle REMOVE_CONNECTION', () => {
    const stateWithConnection = {
      ...initialState,
      connections: { ch1: { id: 'ch1' } as any, ch2: { id: 'ch2' } as any },
    };
    const state = sdkReducer(stateWithConnection, {
      type: ActionType.REMOVE_CONNECTION,
      channelId: 'ch1',
    } as any);
    expect(state.connections.ch1).toBeUndefined();
    expect(state.connections.ch2).toBeDefined();
  });

  it('should handle ADD_CONNECTION', () => {
    const connection = { id: 'ch1', connected: true } as any;
    const state = sdkReducer(initialState, {
      type: ActionType.ADD_CONNECTION,
      channelId: 'ch1',
      connection,
    } as any);
    expect(state.connections.ch1).toEqual(connection);
  });

  it('should handle RESET_CONNECTIONS', () => {
    const connections = { ch1: { id: 'ch1' } as any };
    const state = sdkReducer(initialState, {
      type: ActionType.RESET_CONNECTIONS,
      connections,
    } as any);
    expect(state.connections).toEqual(connections);
  });

  it('should handle SET_CONNECTED when connection exists', () => {
    const stateWithConnection = {
      ...initialState,
      connections: { ch1: { id: 'ch1', connected: false } as any },
    };
    const state = sdkReducer(stateWithConnection, {
      type: ActionType.SET_CONNECTED,
      channelId: 'ch1',
      connected: true,
    } as any);
    expect(state.connections.ch1.connected).toBe(true);
  });

  it('should handle SET_CONNECTED when connection does not exist', () => {
    const state = sdkReducer(initialState, {
      type: ActionType.SET_CONNECTED,
      channelId: 'nonexistent',
      connected: true,
    } as any);
    expect(state).toEqual(initialState);
  });

  it('should handle REMOVE_APPROVED_HOST', () => {
    const stateWithHost = {
      ...initialState,
      approvedHosts: { ch1: 12345, ch2: 67890 },
    };
    const state = sdkReducer(stateWithHost, {
      type: ActionType.REMOVE_APPROVED_HOST,
      channelId: 'ch1',
    } as any);
    expect(state.approvedHosts.ch1).toBeUndefined();
    expect(state.approvedHosts.ch2).toBe(67890);
  });

  it('should handle SET_APPROVED_HOST', () => {
    const state = sdkReducer(initialState, {
      type: ActionType.SET_APPROVED_HOST,
      channelId: 'ch1',
      validUntil: 99999,
    } as any);
    expect(state.approvedHosts.ch1).toBe(99999);
  });

  it('should handle UPDATE_DAPP_CONNECTION', () => {
    const connection = { id: 'dapp1' } as any;
    const state = sdkReducer(initialState, {
      type: ActionType.UPDATE_DAPP_CONNECTION,
      channelId: 'dapp1',
      connection,
    } as any);
    expect(state.dappConnections.dapp1).toEqual(connection);
  });

  it('should handle REMOVE_DAPP_CONNECTION', () => {
    const stateWithDapp = {
      ...initialState,
      dappConnections: { dapp1: { id: 'dapp1' } as any, dapp2: { id: 'dapp2' } as any },
    };
    const state = sdkReducer(stateWithDapp, {
      type: ActionType.REMOVE_DAPP_CONNECTION,
      channelId: 'dapp1',
    } as any);
    expect(state.dappConnections.dapp1).toBeUndefined();
    expect(state.dappConnections.dapp2).toBeDefined();
  });

  it('should handle RESET_DAPP_CONNECTIONS', () => {
    const connections = { dapp1: { id: 'dapp1' } as any };
    const state = sdkReducer(initialState, {
      type: ActionType.RESET_DAPP_CONNECTIONS,
      connections,
    } as any);
    expect(state.dappConnections).toEqual(connections);
  });

  it('should return current state for unknown action', () => {
    const state = sdkReducer(initialState, { type: 'UNKNOWN' } as any);
    expect(state).toBe(initialState);
  });
});
