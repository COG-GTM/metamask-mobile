import type { Action as ReduxAction } from 'redux';
import { ConnectionProps } from '../../core/SDKConnect/Connection';
import { ApprovedHosts, SDKSessions } from '../../core/SDKConnect/SDKConnect';
import { WC2Metadata } from './state';

export enum ActionType {
  WC2_METADATA = 'WC2_METADATA',
  RESET_CONNECTIONS = 'RESET_CONNECTIONS',
  REMOVE_CONNECTION = 'REMOVE_CONNECTION',
  DISCONNECT_ALL = 'DISCONNECT_ALL',
  REMOVE_APPROVED_HOST = 'REMOVE_APPROVWED_HOST',
  RESET_APPROVED_HOSTS = 'RESET_APPROVED_HOSTS',
  UPDATE_DAPP_CONNECTION = 'UPDATE_DAPP_CONNECTION',
  RESET_DAPP_CONNECTIONS = 'RESET_DAPP_CONNECTIONS',
}

export type DisconnectAll = ReduxAction<ActionType.DISCONNECT_ALL>;

export interface ResetConnection
  extends ReduxAction<ActionType.RESET_CONNECTIONS> {
  connections: SDKSessions;
}

export interface RemoveConnection
  extends ReduxAction<ActionType.REMOVE_CONNECTION> {
  channelId: string;
}

export interface RemoveApprovedHost
  extends ReduxAction<ActionType.REMOVE_APPROVED_HOST> {
  channelId: string;
}

export interface ResetApprovedHosts
  extends ReduxAction<ActionType.RESET_APPROVED_HOSTS> {
  approvedHosts: ApprovedHosts;
}

export interface UpdateDappConnection
  extends ReduxAction<ActionType.UPDATE_DAPP_CONNECTION> {
  channelId: string;
  connection: ConnectionProps;
}

export interface ResetDappConnections
  extends ReduxAction<ActionType.RESET_DAPP_CONNECTIONS> {
  connections: SDKSessions;
}

export interface UpdateWC2Metadata
  extends ReduxAction<ActionType.WC2_METADATA> {
  metadata?: WC2Metadata;
}

export type Action =
  | DisconnectAll
  | RemoveConnection
  | ResetConnection
  | RemoveApprovedHost
  | ResetApprovedHosts
  | UpdateWC2Metadata
  | UpdateDappConnection
  | ResetDappConnections;

export const disconnectAll = (): DisconnectAll => ({
  type: ActionType.DISCONNECT_ALL,
});

export const updateWC2Metadata = (
  metadata: WC2Metadata,
): UpdateWC2Metadata => ({
  type: ActionType.WC2_METADATA,
  metadata,
});

export const removeConnection = (channelId: string): RemoveConnection => ({
  type: ActionType.REMOVE_CONNECTION,
  channelId,
});

export const resetConnections = (
  connections: SDKSessions,
): ResetConnection => ({
  type: ActionType.RESET_CONNECTIONS,
  connections,
});

export const removeApprovedHost = (channelId: string): RemoveApprovedHost => ({
  type: ActionType.REMOVE_APPROVED_HOST,
  channelId,
});

export const resetApprovedHosts = (
  approvedHosts: ApprovedHosts,
): ResetApprovedHosts => ({
  type: ActionType.RESET_APPROVED_HOSTS,
  approvedHosts,
});

export const updateDappConnection = (
  channelId: string,
  connection: ConnectionProps,
): UpdateDappConnection => ({
  type: ActionType.UPDATE_DAPP_CONNECTION,
  channelId,
  connection,
});

export const resetDappConnections = (
  connections: SDKSessions,
): ResetDappConnections => ({
  type: ActionType.RESET_DAPP_CONNECTIONS,
  connections,
});
