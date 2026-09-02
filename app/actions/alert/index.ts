export interface ShowAlertPayload {
  isVisible: boolean;
  autodismiss?: number | null;
  content?: string | null;
  data?: unknown;
}

export interface HideAlertAction {
  type: 'HIDE_ALERT';
}

export interface ShowAlertAction extends ShowAlertPayload {
  type: 'SHOW_ALERT';
}

export type AlertAction = HideAlertAction | ShowAlertAction;

export function dismissAlert(): HideAlertAction {
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
