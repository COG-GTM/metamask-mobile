import sdkReducer, { initialState } from './index';
import {
  ActionType,
  addConnection,
  disconnectAll,
  removeApprovedHost,
  removeConnection,
  removeDappConnection,
  resetApprovedHosts,
  resetConnections,
  resetDappConnections,
  setApprovedHost,
  setConnected,
  updateConnection,
  updateDappConnection,
  updateWC2Metadata,
} from '../../actions/sdk';
import { ConnectionProps } from '../../core/SDKConnect/Connection';

const connection = (id: string, connected = true) =>
  ({
    id,
    otherPublicKey: 'key',
    origin: 'origin',
    connected,
  } as unknown as ConnectionProps);

describe('sdkReducer', () => {
  it('returns the initial state', () => {
    expect(sdkReducer(undefined, { type: 'UNKNOWN' } as never)).toEqual(
      initialState,
    );
  });

  it('updates wc2 metadata', () => {
    const metadata = { id: '1', url: 'u', name: 'n', icon: 'i' };
    const state = sdkReducer(initialState, updateWC2Metadata(metadata));
    expect(state.wc2Metadata).toEqual(metadata);
  });

  it('adds, updates and removes connections', () => {
    let state = sdkReducer(initialState, addConnection('a', connection('a')));
    expect(state.connections.a).toEqual(connection('a'));

    state = sdkReducer(state, updateConnection('a', connection('a', false)));
    expect(state.connections.a.connected).toBe(false);

    state = sdkReducer(state, removeConnection('a'));
    expect(state.connections).toEqual({});
  });

  it('disconnects all connections', () => {
    let state = sdkReducer(
      initialState,
      resetConnections({ a: connection('a'), b: connection('b') }),
    );
    state = sdkReducer(state, disconnectAll());
    expect(state.connections.a.connected).toBe(false);
    expect(state.connections.b.connected).toBe(false);
  });

  describe('SET_CONNECTED', () => {
    it('returns the same state when the channel does not exist', () => {
      const state = sdkReducer(initialState, setConnected('missing', true));
      expect(state).toBe(initialState);
    });

    it('updates the connected flag of an existing channel', () => {
      let state = sdkReducer(
        initialState,
        addConnection('a', connection('a', false)),
      );
      state = sdkReducer(state, setConnected('a', true));
      expect(state.connections.a.connected).toBe(true);
    });
  });

  it('sets and removes approved hosts', () => {
    let state = sdkReducer(initialState, setApprovedHost('a', 123));
    expect(state.approvedHosts).toEqual({ a: 123 });

    state = sdkReducer(state, setApprovedHost('b', 456));
    state = sdkReducer(state, removeApprovedHost('a'));
    expect(state.approvedHosts).toEqual({ b: 456 });
  });

  it('ignores RESET_APPROVED_HOSTS (unhandled action)', () => {
    const state = sdkReducer(initialState, resetApprovedHosts({ a: 1 }));
    expect(state).toBe(initialState);
  });

  it('updates, removes and resets dapp connections', () => {
    let state = sdkReducer(
      initialState,
      updateDappConnection('a', connection('a')),
    );
    expect(state.dappConnections.a).toEqual(connection('a'));

    state = sdkReducer(state, removeDappConnection('a'));
    expect(state.dappConnections).toEqual({});

    state = sdkReducer(state, resetDappConnections({ z: connection('z') }));
    expect(state.dappConnections).toEqual({ z: connection('z') });
  });
});

describe('sdk actions', () => {
  it('creates actions with the expected shape', () => {
    expect(disconnectAll()).toEqual({ type: ActionType.DISCONNECT_ALL });
    expect(removeConnection('a')).toEqual({
      type: ActionType.REMOVE_CONNECTION,
      channelId: 'a',
    });
    expect(setApprovedHost('a', 1)).toEqual({
      type: ActionType.SET_APPROVED_HOST,
      channelId: 'a',
      validUntil: 1,
    });
    expect(resetApprovedHosts({ a: 1 })).toEqual({
      type: ActionType.RESET_APPROVED_HOSTS,
      approvedHosts: { a: 1 },
    });
    expect(setConnected('a', false)).toEqual({
      type: ActionType.SET_CONNECTED,
      channelId: 'a',
      connected: false,
    });
    expect(removeDappConnection('a')).toEqual({
      type: ActionType.REMOVE_DAPP_CONNECTION,
      channelId: 'a',
    });
  });
});
