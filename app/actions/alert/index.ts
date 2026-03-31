import { type Action } from 'redux';

/**
 * Alert action type enum
 */
export enum AlertActionType {
  SHOW_ALERT = 'SHOW_ALERT',
  HIDE_ALERT = 'HIDE_ALERT',
}

export interface ShowAlertAction extends Action<AlertActionType.SHOW_ALERT> {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown | null;
}

export type HideAlertAction = Action<AlertActionType.HIDE_ALERT>;

/**
 * Union type for all alert actions
 */
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
}: {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown | null;
}): ShowAlertAction {
  return {
    type: AlertActionType.SHOW_ALERT,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
