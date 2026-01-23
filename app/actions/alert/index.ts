export const AlertActionTypes = {
  SHOW_ALERT: 'SHOW_ALERT',
  HIDE_ALERT: 'HIDE_ALERT',
} as const;

export interface AlertContent {
  title?: string;
  message?: string;
}

export interface ShowAlertAction {
  type: typeof AlertActionTypes.SHOW_ALERT;
  isVisible: boolean;
  autodismiss: number | null;
  content: AlertContent | string | null;
  data: Record<string, unknown> | null;
}

export interface HideAlertAction {
  type: typeof AlertActionTypes.HIDE_ALERT;
}

export type AlertAction = ShowAlertAction | HideAlertAction;

export function dismissAlert(): HideAlertAction {
  return {
    type: AlertActionTypes.HIDE_ALERT,
  };
}

interface ShowAlertParams {
  isVisible: boolean;
  autodismiss: number | null;
  content: AlertContent | string | null;
  data: Record<string, unknown> | null;
}

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: ShowAlertParams): ShowAlertAction {
  return {
    type: AlertActionTypes.SHOW_ALERT,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
