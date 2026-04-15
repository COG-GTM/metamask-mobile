




export let ActionType = /*#__PURE__*/function (ActionType) {ActionType["WC2_METADATA"] = "WC2_METADATA";ActionType["RESET_CONNECTIONS"] = "RESET_CONNECTIONS";ActionType["UPDATE_CONNECTION"] = "UPDATE_CONNECTION";ActionType["REMOVE_CONNECTION"] = "REMOVE_CONNECTION";ActionType["ADD_CONNECTION"] = "ADD_CONNECTION";ActionType["DISCONNECT_ALL"] = "DISCONNECT_ALL";ActionType["REMOVE_APPROVED_HOST"] = "REMOVE_APPROVWED_HOST";ActionType["SET_APPROVED_HOST"] = "SET_APPROVED_HOST";ActionType["RESET_APPROVED_HOSTS"] = "RESET_APPROVED_HOSTS";ActionType["SET_CONNECTED"] = "SET_CONNECTED";ActionType["UPDATE_DAPP_CONNECTION"] = "UPDATE_DAPP_CONNECTION";ActionType["REMOVE_DAPP_CONNECTION"] = "REMOVE_DAPP_CONNECTION";ActionType["RESET_DAPP_CONNECTIONS"] = "RESET_DAPP_CONNECTIONS";return ActionType;}({});































































































export const disconnectAll = () => ({
  type: ActionType.DISCONNECT_ALL
});

export const updateWC2Metadata = (
metadata) => (
{
  type: ActionType.WC2_METADATA,
  metadata
});

export const updateConnection = (
channelId,
connection) => (
{
  type: ActionType.UPDATE_CONNECTION,
  channelId,
  connection
});

export const removeConnection = (channelId) => ({
  type: ActionType.REMOVE_CONNECTION,
  channelId
});

export const addConnection = (
channelId,
connection) => (
{
  type: ActionType.ADD_CONNECTION,
  channelId,
  connection
});

export const resetConnections = (
connections) => (
{
  type: ActionType.RESET_CONNECTIONS,
  connections
});

export const removeApprovedHost = (channelId) => ({
  type: ActionType.REMOVE_APPROVED_HOST,
  channelId
});

export const setApprovedHost = (
channelId,
validUntil) => (
{
  type: ActionType.SET_APPROVED_HOST,
  channelId,
  validUntil
});

export const resetApprovedHosts = (
approvedHosts) => (
{
  type: ActionType.RESET_APPROVED_HOSTS,
  approvedHosts
});

export const updateDappConnection = (
channelId,
connection) => (
{
  type: ActionType.UPDATE_DAPP_CONNECTION,
  channelId,
  connection
});

export const removeDappConnection = (
channelId) => (
{
  type: ActionType.REMOVE_DAPP_CONNECTION,
  channelId
});

export const resetDappConnections = (
connections) => (
{
  type: ActionType.RESET_DAPP_CONNECTIONS,
  connections
});

export const setConnected = (
channelId,
connected) => (
{
  type: ActionType.SET_CONNECTED,
  channelId,
  connected
});