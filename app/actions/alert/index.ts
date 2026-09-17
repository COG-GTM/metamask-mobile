export const HIDE_ALERT = 'HIDE_ALERT' as const;
export const SHOW_ALERT = 'SHOW_ALERT' as const;

export interface ShowAlertPayload {
  isVisible: boolean;
  autodismiss?: number;
  content?: string;
  data?: unknown;
}

interface HideAlertAction {
  type: typeof HIDE_ALERT;
}

interface ShowAlertAction extends ShowAlertPayload {
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
}: ShowAlertPayload): ShowAlertAction {
  return {
    type: SHOW_ALERT,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
