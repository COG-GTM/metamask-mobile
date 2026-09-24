export const HIDE_ALERT = 'HIDE_ALERT';
export const SHOW_ALERT = 'SHOW_ALERT';

export interface AlertPayload {
  isVisible: boolean;
  autodismiss?: number | null;
  content?: string | null;
  data?: Record<string, unknown> | null;
}

export interface HideAlertAction {
  type: typeof HIDE_ALERT;
}

export interface ShowAlertAction extends AlertPayload {
  type: typeof SHOW_ALERT;
}

export type AlertActionTypes = HideAlertAction | ShowAlertAction;

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
