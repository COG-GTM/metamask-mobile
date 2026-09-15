export const SHOW_ALERT = 'SHOW_ALERT';
export const HIDE_ALERT = 'HIDE_ALERT';

interface ShowAlertAction {
  type: typeof SHOW_ALERT;
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

interface HideAlertAction {
  type: typeof HIDE_ALERT;
}

export type AlertAction = ShowAlertAction | HideAlertAction;

export function dismissAlert(): HideAlertAction {
  return {
    type: HIDE_ALERT,
  };
}

interface ShowAlertArgs {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: ShowAlertArgs): ShowAlertAction {
  return {
    type: SHOW_ALERT,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
