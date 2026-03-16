interface AlertContent {
  title?: string;
  message?: string;
}

// TODO: Replace 'any' with proper type
type AlertData = Record<string, any>;

interface ShowAlertAction {
  type: 'SHOW_ALERT';
  isVisible: boolean;
  autodismiss: number | null;
  content: AlertContent | string | null;
  data: AlertData | null;
}

interface HideAlertAction {
  type: 'HIDE_ALERT';
}

export type AlertActionTypes = ShowAlertAction | HideAlertAction;

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
}: {
  isVisible: boolean;
  autodismiss: number | null;
  content: AlertContent | string | null;
  data: AlertData | null;
}): ShowAlertAction {
  return {
    type: 'SHOW_ALERT',
    isVisible,
    autodismiss,
    content,
    data,
  };
}
