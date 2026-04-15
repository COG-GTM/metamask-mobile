

/**
 * Deference action types available for different RPC event flow
 */
export let AccountsActionType = /*#__PURE__*/function (AccountsActionType) {AccountsActionType["SET_RELOAD_ACCOUNTS"] = "SET_RELOAD_ACCOUNTS";return AccountsActionType;}({});



/**
 * Extend redux Action interface to add rpcName, eventStage and error properties
 */




/**
 * setReloadAccounts action creator
 * @param {boolean} reloadAccounts: true to reload accounts, false otherwise
 * @returns {iAccountActions} - the action object to set reloadAccounts
 */
export function setReloadAccounts(reloadAccounts) {
  return {
    type: AccountsActionType.SET_RELOAD_ACCOUNTS,
    reloadAccounts
  };
}