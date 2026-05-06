import type { Action as ReduxAction } from 'redux';

export enum ActionType {
  HIDE_ALERT = 'HIDE_ALERT',
  SHOW_ALERT = 'SHOW_ALERT',
}

export interface HideAlertAction extends ReduxAction<ActionType.HIDE_ALERT> {}

export interface ShowAlertAction extends ReduxAction<ActionType.SHOW_ALERT> {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

export type Action = HideAlertAction | ShowAlertAction;

export function dismissAlert(): HideAlertAction {
  return {
    type: ActionType.HIDE_ALERT,
  };
}

export interface ShowAlertPayload {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: ShowAlertPayload): ShowAlertAction {
  return {
    type: ActionType.SHOW_ALERT,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
