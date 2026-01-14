import type { Action as ReduxAction } from 'redux';

export enum AlertActionType {
  SHOW_ALERT = 'SHOW_ALERT',
  HIDE_ALERT = 'HIDE_ALERT',
}

export interface ShowAlertAction
  extends ReduxAction<AlertActionType.SHOW_ALERT> {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: Record<string, unknown> | null;
}

export interface HideAlertAction
  extends ReduxAction<AlertActionType.HIDE_ALERT> {}

export type AlertAction = ShowAlertAction | HideAlertAction;

export interface ShowAlertParams {
  isVisible?: boolean;
  autodismiss?: number | null;
  content?: string | null;
  data?: Record<string, unknown> | null;
}

export function dismissAlert(): HideAlertAction {
  return {
    type: AlertActionType.HIDE_ALERT,
  };
}

export function showAlert({
  isVisible = true,
  autodismiss = null,
  content = null,
  data = null,
}: ShowAlertParams): ShowAlertAction {
  return {
    type: AlertActionType.SHOW_ALERT,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
