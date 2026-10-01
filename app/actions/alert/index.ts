interface AlertData {
  [key: string]: unknown;
}

interface ShowAlertParams {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: AlertData | null;
}

interface DismissAlertAction {
  type: 'HIDE_ALERT';
}

interface ShowAlertAction {
  type: 'SHOW_ALERT';
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: AlertData | null;
}

export type AlertAction = DismissAlertAction | ShowAlertAction;

export function dismissAlert(): DismissAlertAction {
  return {
    type: 'HIDE_ALERT',
  };
}

export function showAlert({ isVisible, autodismiss, content, data }: ShowAlertParams): ShowAlertAction {
  return {
    type: 'SHOW_ALERT',
    isVisible,
    autodismiss,
    content,
    data,
  };
}
