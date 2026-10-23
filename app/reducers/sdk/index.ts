import { createSlice, isDraft, original, type Draft } from '@reduxjs/toolkit';
import type { SDKState } from '../../actions/sdk/state';
import {
  ActionType,
  type AddConnection,
  type RemoveApprovedHost,
  type RemoveConnection,
  type RemoveDappConnection,
  type ResetConnection,
  type ResetDappConnections,
  type SetApprovedHost,
  type SetConnected,
  type UpdateConnection,
  type UpdateDappConnection,
  type UpdateWC2Metadata,
} from '../../actions/sdk';

export type { SDKState };
export type SdkState = SDKState;

// sdk reducers
export const initialState: Readonly<SdkState> = {
  connections: {},
  approvedHosts: {},
  dappConnections: {},
  wc2Metadata: undefined,
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * Structural copy of plain objects and arrays (other values are kept as-is).
 */
const copyPayload = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => copyPayload(item)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      copy[key] = copyPayload(value[key]);
    }
    return copy as T;
  }
  return value;
};

/**
 * Wraps a legacy-style pure case reducer so that Immer's auto-freeze never
 * reaches objects SDKConnect still holds and mutates. The legacy function runs
 * on the plain (non-draft) state, and its result is copied in full before it is
 * returned. That way only reducer-private copies get frozen: action payloads,
 * and maps that were shared with the live SDKConnect instance after rehydration
 * (e.g. `dappConnections` in asyncInit), are never frozen. When the legacy
 * reducer returns the input state unchanged, the same reference is returned.
 */
const legacyCase =
  <A>(reduce: (state: SdkState, action: A) => SdkState) =>
  (draft: Draft<SdkState>, action: A): SdkState | Draft<SdkState> => {
    const state = (isDraft(draft) ? original(draft) : draft) as SdkState;
    const next = reduce(state, action);
    return next === state ? draft : copyPayload(next);
  };

const slice = createSlice({
  name: 'sdk',
  initialState: initialState as SdkState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        ActionType.WC2_METADATA,
        legacyCase((state, action: UpdateWC2Metadata) => ({
          ...state,
          wc2Metadata: action.metadata,
        })),
      )
      .addCase(
        ActionType.DISCONNECT_ALL,
        legacyCase((state) => ({
          ...state,
          // Set connected: false to all connections
          connections: Object.keys(state.connections).reduce(
            (acc, channelId) => ({
              ...acc,
              [channelId]: {
                ...state.connections[channelId],
                connected: false,
              },
            }),
            {},
          ),
        })),
      )
      .addCase(
        ActionType.UPDATE_CONNECTION,
        legacyCase((state, action: UpdateConnection) => ({
          ...state,
          connections: {
            ...state.connections,
            [action.channelId]: action.connection,
          },
        })),
      )
      .addCase(
        ActionType.REMOVE_CONNECTION,
        legacyCase((state, action: RemoveConnection) => {
          const { [action.channelId]: _, ...connections } = state.connections;
          return {
            ...state,
            connections,
          };
        }),
      )
      .addCase(
        ActionType.ADD_CONNECTION,
        legacyCase((state, action: AddConnection) => ({
          ...state,
          connections: {
            ...state.connections,
            [action.channelId]: action.connection,
          },
        })),
      )
      .addCase(
        ActionType.RESET_CONNECTIONS,
        legacyCase((state, action: ResetConnection) => ({
          ...state,
          connections: action.connections,
        })),
      )
      .addCase(
        ActionType.SET_CONNECTED,
        legacyCase((state, action: SetConnected) => {
          if (!state.connections[action.channelId]) {
            return state;
          }
          return {
            ...state,
            connections: {
              ...state.connections,
              [action.channelId]: {
                ...state.connections[action.channelId],
                connected: action.connected,
              },
            },
          };
        }),
      )
      .addCase(
        ActionType.REMOVE_APPROVED_HOST,
        legacyCase((state, action: RemoveApprovedHost) => {
          const { [action.channelId]: _, ...approvedHosts } =
            state.approvedHosts;
          return {
            ...state,
            approvedHosts,
          };
        }),
      )
      .addCase(
        ActionType.SET_APPROVED_HOST,
        legacyCase((state, action: SetApprovedHost) => ({
          ...state,
          approvedHosts: {
            ...state.approvedHosts,
            [action.channelId]: action.validUntil,
          },
        })),
      )
      .addCase(
        ActionType.UPDATE_DAPP_CONNECTION,
        legacyCase((state, action: UpdateDappConnection) => ({
          ...state,
          dappConnections: {
            ...state.dappConnections,
            [action.channelId]: action.connection,
          },
        })),
      )
      .addCase(
        ActionType.REMOVE_DAPP_CONNECTION,
        legacyCase((state, action: RemoveDappConnection) => {
          const { [action.channelId]: _, ...dappConnections } =
            state.dappConnections;
          return {
            ...state,
            dappConnections,
          };
        }),
      )
      .addCase(
        ActionType.RESET_DAPP_CONNECTIONS,
        legacyCase((state, action: ResetDappConnections) => ({
          ...state,
          dappConnections: action.connections,
        })),
      );
  },
});

export default slice.reducer;
