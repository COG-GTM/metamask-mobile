export interface AlertConfig {
  isVisible: boolean;
  autodismiss?: number | null;
  content?: string | null;
  data?: unknown;
}

export function dismissAlert() {
  return {
    type: 'HIDE_ALERT',
  };
}

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: AlertConfig) {
  return {
    type: 'SHOW_ALERT',
    isVisible,
    autodismiss,
    content,
    data,
  };
}
