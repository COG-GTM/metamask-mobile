export const HIDE_ALERT = 'HIDE_ALERT' as const;
export const SHOW_ALERT = 'SHOW_ALERT' as const;

export interface AlertPayload {
  isVisible: boolean;
  autodismiss?: number | null;
  content?: string | null;
  data?: unknown;
}

export interface HideAlertAction {
  type: typeof HIDE_ALERT;
}

export interface ShowAlertAction extends AlertPayload {
  type: typeof SHOW_ALERT;
}

export type AlertAction = HideAlertAction | ShowAlertAction;

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
}: AlertPayload): ShowAlertAction {
  return {
    type: SHOW_ALERT,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
