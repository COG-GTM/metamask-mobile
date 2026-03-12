interface AlertData {
  [key: string]: unknown;
}

interface ShowAlertParams {
  isVisible: boolean;
  autodismiss: number;
  content: string;
  data: AlertData;
}

export function dismissAlert() {
  return {
    type: 'HIDE_ALERT' as const,
  };
}

export function showAlert({ isVisible, autodismiss, content, data }: ShowAlertParams) {
  return {
    type: 'SHOW_ALERT' as const,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
