/**
 * This reducer to used to record the lifecycle stage from RPC calls so that UI can subscribe to it and display or change UI behaviour corresponding based on that stage information.
 *
 * the current available stage has been defined in RPCStageTypes enum, please extend it if you need more stages.
 *
 * Some similar RPC calls will be grouped into the same event group, for example, personal_sign, eth_signTypedData, eth_signTypedData_v3,
 * eth_signTypedData_v4 will be grouped into signingEvent group so that the UI can handle all similar RPC calls in the same way. Please refer to rpcToEventGroupMap for more details.
 *
 * rpcToEventGroupMap will be also used by RPCMiddleware to check whether RPC is whitelisted to track the event stage.
 * if you want to track proticular RPC event stage which is not in whitelist, please add it to rpcToEventGroupMap.
 * if your RPC didn't belong to any event group, just use RPC name as event group name for that RPC. (**Causion**: please make sure the RPC name is unique)
 */

import { createSlice } from '@reduxjs/toolkit';
import {
  ActionType,
  type ResetEventStageAction,
  type SetEventErrorAction,
  type SetEventStageAction,
} from '../../actions/rpcEvents';

/**
 * Mapping of RPC name to supported event group name
 */
const rpcToEventGroupMap = new Map([
  ['personal_sign', 'signingEvent'],
  ['eth_signTypedData', 'signingEvent'],
  ['eth_signTypedData_v3', 'signingEvent'],
  ['eth_signTypedData_v4', 'signingEvent'],
]);

/**
 * check if the rpcName is whitelisted to track the event stage.
 * @param {string} rpcName - the rpc name which fires the event
 * @returns {boolean} - true if the rpcName is whitelisted
 */
export const isWhitelistedRPC = (rpcName: string): boolean =>
  rpcToEventGroupMap.has(rpcName);

/**
 * Deference stage in RPC flow
 */
export enum RPCStageTypes {
  IDLE = 'idle',
  REQUEST_SEND = 'request_send',
  COMPLETE = 'complete',
  ERROR = 'error',
}

/**
 * Defined the event stage properties to be stored in store
 * Different event group will have different eventStage
 * @param {string} eventStage - the current stage of the event flow
 * @param {string} rpcName - the RPC name which fires the event
 * @param {Error | unknown} error - optional error object to be set in store
 */
export interface iEventStage {
  eventStage: string;
  rpcName: string;
  error?: Error;
}

/**
 * Interface for defining what properties will be defined in store
 * please extend this interface to add more supported RPC events
 */
export interface iEventGroup {
  signingEvent: iEventStage;
}

export type RpcEventsState = iEventGroup;

/**
 * Initial state of the RPC event flow
 */
export const initialState: Readonly<RpcEventsState> = {
  signingEvent: {
    eventStage: RPCStageTypes.IDLE,
    rpcName: '',
  },
};

/**
 * Resolve the event group an action targets. Returns undefined when the RPC
 * is not whitelisted or the group is missing from state, in which case the
 * state is left untouched (same reference).
 */
const getTargetEventGroup = (
  state: RpcEventsState,
  rpcName: string,
): keyof RpcEventsState | undefined => {
  const eventGroup = rpcToEventGroupMap.get(rpcName) as
    | keyof RpcEventsState
    | undefined;
  if (!eventGroup || !state[eventGroup]) {
    return undefined;
  }
  return eventGroup;
};

/**
 * Slice to set the RPC event stage in store. Legacy action types are handled
 * in extraReducers so that existing action creators keep their shape.
 */
const slice = createSlice({
  name: 'rpcEvents',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        ActionType.SET_EVENT_STAGE,
        (state, action: SetEventStageAction) => {
          const eventGroup = getTargetEventGroup(state, action.rpcName);
          if (!eventGroup) {
            return state;
          }
          state[eventGroup] = {
            eventStage: action.eventStage as string,
            rpcName: action.rpcName,
            error: undefined,
          };
        },
      )
      .addCase(
        ActionType.RESET_EVENT_STATE,
        (state, action: ResetEventStageAction) => {
          const eventGroup = getTargetEventGroup(state, action.rpcName);
          if (!eventGroup) {
            return state;
          }
          state[eventGroup] = {
            eventStage: RPCStageTypes.IDLE,
            rpcName: '',
            error: undefined,
          };
        },
      )
      .addCase(
        ActionType.SET_EVENT_ERROR,
        (state, action: SetEventErrorAction) => {
          const eventGroup = getTargetEventGroup(state, action.rpcName);
          if (!eventGroup) {
            return state;
          }
          state[eventGroup] = {
            eventStage: RPCStageTypes.ERROR,
            rpcName: action.rpcName,
            error: action.error as Error | undefined,
          };
        },
      );
  },
});

export default slice.reducer;
