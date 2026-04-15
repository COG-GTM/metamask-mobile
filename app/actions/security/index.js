/* eslint-disable import/prefer-default-export */


export let ActionType = /*#__PURE__*/function (ActionType) {ActionType["SET_ALLOW_LOGIN_WITH_REMEMBER_ME"] = "SET_ALLOW_LOGIN_WITH_REMEMBER_ME";ActionType["SET_AUTOMATIC_SECURITY_CHECKS"] = "SET_AUTOMATIC_SECURITY_CHECKS";ActionType["USER_SELECTED_AUTOMATIC_SECURITY_CHECKS_OPTION"] = "USER_SELECTED_AUTOMATIC_SECURITY_CHECKS_OPTION";ActionType["SET_AUTOMATIC_SECURITY_CHECKS_MODAL_OPEN"] = "SET_AUTOMATIC_SECURITY_CHECKS_MODAL_OPEN";ActionType["SET_DATA_COLLECTION_FOR_MARKETING"] = "SET_DATA_COLLECTION_FOR_MARKETING";ActionType["SET_NFT_AUTO_DETECTION_MODAL_OPEN"] = "SET_NFT_AUTO_DETECTION_MODAL_OPEN";ActionType["SET_MULTI_RPC_MIGRATION_MODAL_OPEN"] = "SET_MULTI_RPC_MIGRATION_MODAL_OPEN";return ActionType;}({});





















































export const setAllowLoginWithRememberMe = (
enabled) => (
{
  type: ActionType.SET_ALLOW_LOGIN_WITH_REMEMBER_ME,
  enabled
});

export const setAutomaticSecurityChecks = (
enabled) => (
{
  type: ActionType.SET_AUTOMATIC_SECURITY_CHECKS,
  enabled
});

export const userSelectedAutomaticSecurityChecksOptions =
() => ({
  type: ActionType.USER_SELECTED_AUTOMATIC_SECURITY_CHECKS_OPTION,
  selected: true
});

export const setAutomaticSecurityChecksModalOpen = (
open) => (
{
  type: ActionType.SET_AUTOMATIC_SECURITY_CHECKS_MODAL_OPEN,
  open
});

export const setNftAutoDetectionModalOpen = (
open) => (
{
  type: ActionType.SET_NFT_AUTO_DETECTION_MODAL_OPEN,
  open
});

export const setMultiRpcMigrationModalOpen = (
open) => (
{
  type: ActionType.SET_MULTI_RPC_MIGRATION_MODAL_OPEN,
  open
});

export const setDataCollectionForMarketing = (enabled) => ({
  type: ActionType.SET_DATA_COLLECTION_FOR_MARKETING,
  enabled
});