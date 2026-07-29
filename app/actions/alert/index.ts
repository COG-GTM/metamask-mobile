export const SHOW_ALERT = 'SHOW_ALERT' as const;
export const HIDE_ALERT = 'HIDE_ALERT' as const;

export interface AlertData {
  msg?: string;
  width?: string;
}

export interface AlertContent {
  isVisible: boolean;
  autodismiss?: number | null;
  content?: string | null;
  data?: AlertData | null;
}

export interface ShowAlertAction extends AlertContent {
  type: typeof SHOW_ALERT;
}

export interface HideAlertAction {
  type: typeof HIDE_ALERT;
}

export type AlertAction = ShowAlertAction | HideAlertAction;

export function dismissAlert(): HideAlertAction {
  return {
    type: HIDE_ALERT,
  };
}

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: AlertContent): ShowAlertAction {
  return {
    type: SHOW_ALERT,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
