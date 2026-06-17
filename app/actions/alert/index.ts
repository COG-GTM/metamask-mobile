export const HIDE_ALERT = 'HIDE_ALERT' as const;
export const SHOW_ALERT = 'SHOW_ALERT' as const;

export interface ShowAlertPayload {
  isVisible: boolean;
  autodismiss?: number | null;
  content?: string | null;
  data?: unknown;
}

export interface DismissAlertAction {
  type: typeof HIDE_ALERT;
}

export interface ShowAlertAction extends ShowAlertPayload {
  type: typeof SHOW_ALERT;
}

export type AlertAction = DismissAlertAction | ShowAlertAction;

export function dismissAlert(): DismissAlertAction {
  return {
    type: HIDE_ALERT,
  };
}

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: ShowAlertPayload): ShowAlertAction {
  return {
    type: SHOW_ALERT,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
