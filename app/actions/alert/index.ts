export interface HideAlertAction {
  type: 'HIDE_ALERT';
}

export interface ShowAlertAction {
  type: 'SHOW_ALERT';
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
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
}: Omit<ShowAlertAction, 'type'>): ShowAlertAction {
  return {
    type: 'SHOW_ALERT',
    isVisible,
    autodismiss,
    content,
    data,
  };
}
