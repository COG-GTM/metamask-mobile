export const SHOW_ALERT = 'SHOW_ALERT' as const;
export const HIDE_ALERT = 'HIDE_ALERT' as const;

interface ShowAlertPayload {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

interface ShowAlertAction extends ShowAlertPayload {
  type: typeof SHOW_ALERT;
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
