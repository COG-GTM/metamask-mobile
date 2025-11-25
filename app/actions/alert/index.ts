// Type definitions
interface AlertParams {
  isVisible: boolean;
  autodismiss: number;
  content: string;
  data?: Record<string, unknown>;
}

export function dismissAlert() {
  return {
    type: 'HIDE_ALERT' as const,
  };
}

export function showAlert({ isVisible, autodismiss, content, data }: AlertParams) {
  return {
    type: 'SHOW_ALERT' as const,
    isVisible,
    autodismiss,
    content,
    data,
  };
}
