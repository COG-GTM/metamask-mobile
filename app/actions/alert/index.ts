const HIDE_ALERT = 'HIDE_ALERT' as const;
const SHOW_ALERT = 'SHOW_ALERT' as const;

interface ShowAlertParams {
  isVisible: boolean;
  autodismiss: number;
  content: string;
  data: string;
}

interface HideAlertAction {
  type: typeof HIDE_ALERT;
}

interface ShowAlertAction {
  type: typeof SHOW_ALERT;
  isVisible: boolean;
  autodismiss: number;
  content: string;
  data: string;
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
}: ShowAlertParams): ShowAlertAction {
  return {
    type: SHOW_ALERT,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
