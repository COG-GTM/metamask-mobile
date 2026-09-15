import { type Action } from 'redux';

export enum AlertActionType {
  SHOW_ALERT = 'SHOW_ALERT',
  HIDE_ALERT = 'HIDE_ALERT',
}

export interface AlertData {
  msg?: string;
  [key: string]: unknown;
}

export interface ShowAlertParams {
  isVisible: boolean;
  autodismiss: number | null;
  content: string;
  data: AlertData | null;
}

export type ShowAlertAction = Action<AlertActionType.SHOW_ALERT> &
  ShowAlertParams;

export type HideAlertAction = Action<AlertActionType.HIDE_ALERT>;

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
