export function dismissAlert() {
  return {
    type: 'HIDE_ALERT' as const,
  };
}

interface ShowAlertParams {
  isVisible: boolean;
  autodismiss: number;
  content: string;
  data: Record<string, unknown>;
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
