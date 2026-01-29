interface ShowAlertPayload {
  isVisible: boolean;
  autodismiss?: number;
  content: string | React.ReactNode | null;
  data?: Record<string, unknown>;
}

interface DismissAlertAction {
  type: 'HIDE_ALERT';
}

interface ShowAlertAction extends ShowAlertPayload {
  type: 'SHOW_ALERT';
}

export type AlertAction = DismissAlertAction | ShowAlertAction;

export function dismissAlert(): DismissAlertAction {
  return {
    type: 'HIDE_ALERT',
  };
}

export function showAlert({ isVisible, autodismiss, content, data }: ShowAlertPayload): ShowAlertAction {
  return {
    type: 'SHOW_ALERT',
    isVisible,
    autodismiss,
    content,
    data,
  };
}
