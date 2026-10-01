export const HIDE_ALERT = 'HIDE_ALERT' as const;
export const SHOW_ALERT = 'SHOW_ALERT' as const;

interface ShowAlertPayload {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: Record<string, unknown> | null;
}

interface DismissAlertAction {
  type: typeof HIDE_ALERT;
}

interface ShowAlertAction {
  type: typeof SHOW_ALERT;
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: Record<string, unknown> | null;
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
