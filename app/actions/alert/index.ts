export interface AlertConfig {
  isVisible: boolean;
  autodismiss: number | null;
  content: string;
  data: unknown;
}

export interface DismissAlertAction {
  type: 'HIDE_ALERT';
}

export interface ShowAlertAction extends AlertConfig {
  type: 'SHOW_ALERT';
}

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
}: AlertConfig): ShowAlertAction {
  return {
    type: 'SHOW_ALERT',
    isVisible,
    autodismiss,
    content,
    data,
  };
}
