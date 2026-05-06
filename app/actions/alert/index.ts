import type { Action } from 'redux';

export interface ShowAlertPayload {
  isVisible: boolean;
  autodismiss?: number;
  content?: string;
  data?: Record<string, unknown>;
}

export type DismissAlertAction = Action<'HIDE_ALERT'>;

export interface ShowAlertAction extends Action<'SHOW_ALERT'>, ShowAlertPayload {}

export type AlertAction = DismissAlertAction | ShowAlertAction;

export function dismissAlert(): DismissAlertAction {
  return {
    type: 'HIDE_ALERT',
  };
}

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: ShowAlertPayload): ShowAlertAction {
  return {
    type: 'SHOW_ALERT',
    isVisible,
    autodismiss,
    content,
    data,
  };
}
