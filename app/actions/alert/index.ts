export const SHOW_ALERT = 'SHOW_ALERT';
export const HIDE_ALERT = 'HIDE_ALERT';

export interface ShowAlertConfig {
  isVisible: boolean;
  autodismiss?: number | null;
  content?: string | null;
  data?: Record<string, unknown> | null;
}

export interface ShowAlertAction extends ShowAlertConfig {
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
}: ShowAlertConfig): ShowAlertAction {
  return {
    type: SHOW_ALERT,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
