interface AlertData {
  isVisible?: boolean;
  autodismiss?: number | null;
  content?: string | null;
  data?: unknown;
}

interface DismissAlertAction {
  type: 'HIDE_ALERT';
}

interface ShowAlertAction {
  type: 'SHOW_ALERT';
  isVisible?: boolean;
  autodismiss?: number | null;
  content?: string | null;
  data?: unknown;
}

export type AlertAction = DismissAlertAction | ShowAlertAction;

export function dismissAlert(): DismissAlertAction {
  return {
    type: 'HIDE_ALERT',
  };
}

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: AlertData): ShowAlertAction {
  return {
    type: 'SHOW_ALERT',
    isVisible,
    autodismiss,
    content,
    data,
  };
}
