import type { Action as ReduxAction } from 'redux';

export enum ActionType {
  HIDE_ALERT = 'HIDE_ALERT',
  SHOW_ALERT = 'SHOW_ALERT',
}

export interface AlertData {
  msg?: string;
  width?: string;
  [key: string]: unknown;
}

export interface ShowAlertParams {
  isVisible?: boolean;
  autodismiss?: number | null;
  content?: string | null;
  data?: AlertData | null;
}

export type DismissAlertAction = ReduxAction<ActionType.HIDE_ALERT>;

export interface ShowAlertAction extends ReduxAction<ActionType.SHOW_ALERT> {
  isVisible: ShowAlertParams['isVisible'];
  autodismiss: ShowAlertParams['autodismiss'];
  content: ShowAlertParams['content'];
  data: ShowAlertParams['data'];
}

export type Action = DismissAlertAction | ShowAlertAction;

export function dismissAlert(): DismissAlertAction {
  return {
    type: ActionType.HIDE_ALERT,
  };
}

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: ShowAlertParams): ShowAlertAction {
  return {
    type: ActionType.SHOW_ALERT,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
