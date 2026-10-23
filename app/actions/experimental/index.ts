import type { Action as ReduxAction } from 'redux';

export enum ActionType {
  SET_SECURITY_ALERTS_ENABLED = 'SET_SECURITY_ALERTS_ENABLED',
  SET_PPOM_INITIALIZATION_STATUS = 'SET_PPOM_INITIALIZATION_STATUS',
}

export interface SetSecurityAlertsEnabled
  extends ReduxAction<ActionType.SET_SECURITY_ALERTS_ENABLED> {
  securityAlertsEnabled: boolean;
}

export type SetPPOMInitializationStatus =
  ReduxAction<ActionType.SET_PPOM_INITIALIZATION_STATUS>;

export type Action = SetSecurityAlertsEnabled | SetPPOMInitializationStatus;
