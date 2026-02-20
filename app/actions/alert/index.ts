import { Action } from 'redux';

export enum AlertActionType {
  SHOW_ALERT = 'SHOW_ALERT',
  HIDE_ALERT = 'HIDE_ALERT',
}

export interface ShowAlertParams {
  isVisible?: boolean;
  autodismiss?: number | false;
  content?: string;
  data?: unknown;
}

export interface ShowAlertAction extends Action<AlertActionType.SHOW_ALERT> {
  type: AlertActionType.SHOW_ALERT;
  isVisible?: boolean;
  autodismiss?: number | false;
  content?: string;
  data?: unknown;
}

export interface HideAlertAction extends Action<AlertActionType.HIDE_ALERT> {
  type: AlertActionType.HIDE_ALERT;
}

export type AlertAction = ShowAlertAction | HideAlertAction;

export function dismissAlert(): HideAlertAction {
  return {
    type: AlertActionType.HIDE_ALERT,
  };
}

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: ShowAlertParams): ShowAlertAction {
  return {
    type: AlertActionType.SHOW_ALERT,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
