import { createSlice } from '@reduxjs/toolkit';
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
 * Payloads are copied before entering state so that Immer's auto-freeze does
 * not freeze objects the caller still owns (SDKConnect passes its live
 * `instance.state.connections` map and mutates it afterwards).
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
 * Case reducers return fresh objects (as the legacy switch reducer did) so
 * that every handled action yields a new state reference.
 */
const slice = createSlice({
  name: 'sdk',
  initialState: initialState as SdkState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        ActionType.WC2_METADATA,
        (state, action: UpdateWC2Metadata) => ({
          ...state,
          wc2Metadata: copyPayload(action.metadata),
        }),
      )
      .addCase(ActionType.DISCONNECT_ALL, (state) => ({
        ...state,
        // Set connected: false to all connections
        connections: Object.keys(state.connections).reduce(
          (acc, channelId) => ({
            ...acc,
            [channelId]: { ...state.connections[channelId], connected: false },
          }),
          {},
        ),
      }))
      .addCase(
        ActionType.UPDATE_CONNECTION,
        (state, action: UpdateConnection) => ({
          ...state,
          connections: {
            ...state.connections,
            [action.channelId]: copyPayload(action.connection),
          },
        }),
      )
      .addCase(
        ActionType.REMOVE_CONNECTION,
        (state, action: RemoveConnection) => {
          const { [action.channelId]: _, ...connections } = state.connections;
          return {
            ...state,
            connections,
          };
        },
      )
      .addCase(ActionType.ADD_CONNECTION, (state, action: AddConnection) => ({
        ...state,
        connections: {
          ...state.connections,
          [action.channelId]: copyPayload(action.connection),
        },
      }))
      .addCase(
        ActionType.RESET_CONNECTIONS,
        (state, action: ResetConnection) => ({
          ...state,
          connections: copyPayload(action.connections),
        }),
      )
      .addCase(ActionType.SET_CONNECTED, (state, action: SetConnected) => {
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
      })
      .addCase(
        ActionType.REMOVE_APPROVED_HOST,
        (state, action: RemoveApprovedHost) => {
          const { [action.channelId]: _, ...approvedHosts } =
            state.approvedHosts;
          return {
            ...state,
            approvedHosts,
          };
        },
      )
      .addCase(
        ActionType.SET_APPROVED_HOST,
        (state, action: SetApprovedHost) => ({
          ...state,
          approvedHosts: {
            ...state.approvedHosts,
            [action.channelId]: action.validUntil,
          },
        }),
      )
      .addCase(
        ActionType.UPDATE_DAPP_CONNECTION,
        (state, action: UpdateDappConnection) => ({
          ...state,
          dappConnections: {
            ...state.dappConnections,
            [action.channelId]: copyPayload(action.connection),
          },
        }),
      )
      .addCase(
        ActionType.REMOVE_DAPP_CONNECTION,
        (state, action: RemoveDappConnection) => {
          const { [action.channelId]: _, ...dappConnections } =
            state.dappConnections;
          return {
            ...state,
            dappConnections,
          };
        },
      )
      .addCase(
        ActionType.RESET_DAPP_CONNECTIONS,
        (state, action: ResetDappConnections) => ({
          ...state,
          dappConnections: copyPayload(action.connections),
        }),
      );
  },
});

export default slice.reducer;
