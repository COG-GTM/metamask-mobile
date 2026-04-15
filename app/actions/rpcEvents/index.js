import { RPCStageTypes } from '../../reducers/rpcEvents';


/**
 * Deference action types available for different RPC event flow
 */
export let ActionType = /*#__PURE__*/function (ActionType) {ActionType["SET_EVENT_STAGE"] = "SET_EVENT_STAGE";ActionType["RESET_EVENT_STATE"] = "RESET_EVENT_STATE";ActionType["SET_EVENT_ERROR"] = "SET_EVENT_ERROR";return ActionType;}({});





/**
 * Extend redux Action interface to add rpcName, eventStage and error properties
 */






/**
 * Set the new RPC event stage.
 * @param {string} rpcName - the rpc mehtod name which fires the event
 * @param {string} eventStage - the crrent stage of the eventflow
 * @returns {iEventAction} - Action object with type and payload to be passed to reducer
 */
export function setEventStage(
rpcName,
eventStage)
{
  return {
    rpcName,
    type: ActionType.SET_EVENT_STAGE,
    eventStage
  };
}

/**
 * Reset the RPC event stage in store to default IDLE stage.
 * @param {string} rpcName - the rpc method name which fires the event
 * @returns {iEventAction} - Action object with type and payload to be passed to reducer
 */
export function resetEventStage(rpcName) {
  return {
    type: ActionType.RESET_EVENT_STATE,
    rpcName
  };
}

/**
 * Set the error stage if any error occurs in the event flow.
 * This method will change the event group stage to ERROR.
 * @param {string} rpcName - the rpc method name which fires the event
 * @param {Error | unknown} e - Error object to be set in store
 * @returns {iEventAction} - Action object to be passed to reducer
 */
export function setEventStageError(
rpcName,
e)
{
  return {
    type: ActionType.SET_EVENT_ERROR,
    rpcName,
    eventStage: RPCStageTypes.ERROR,
    error: e
  };
}