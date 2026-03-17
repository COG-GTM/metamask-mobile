import type { Action as ReduxAction } from 'redux';

export enum AlertActionType {
  SHOW_ALERT = 'SHOW_ALERT',
  HIDE_ALERT = 'HIDE_ALERT',
}

export interface DismissAlertAction
  extends ReduxAction<AlertActionType.HIDE_ALERT> {}

export interface ShowAlertAction
  extends ReduxAction<AlertActionType.SHOW_ALERT> {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

export type AlertAction = DismissAlertAction | ShowAlertAction;

export function dismissAlert(): DismissAlertAction {
  return {
    type: AlertActionType.HIDE_ALERT,
  };
}

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}): ShowAlertAction {
  return {
    type: AlertActionType.SHOW_ALERT,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
