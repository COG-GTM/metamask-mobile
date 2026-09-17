export const SHOW_ALERT = 'SHOW_ALERT' as const;
export const HIDE_ALERT = 'HIDE_ALERT' as const;

export interface ShowAlertConfig {
  isVisible: boolean;
  autodismiss?: number;
  content?: string;
  data?: unknown;
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
