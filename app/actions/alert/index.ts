export const SHOW_ALERT = 'SHOW_ALERT';
export const HIDE_ALERT = 'HIDE_ALERT';

interface ShowAlertConfig {
  isVisible: boolean;
  autodismiss?: number;
  content?: string;
  data?: Record<string, unknown>;
}

interface ShowAlertAction extends ShowAlertConfig {
  type: typeof SHOW_ALERT;
}

interface DismissAlertAction {
  type: typeof HIDE_ALERT;
}

export type AlertActionTypes = ShowAlertAction | DismissAlertAction;

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
}: ShowAlertConfig): ShowAlertAction {
  return {
    type: SHOW_ALERT,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
