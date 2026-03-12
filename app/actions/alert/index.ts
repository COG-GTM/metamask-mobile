export function dismissAlert(): { type: string } {
  return {
    type: 'HIDE_ALERT',
  };
}

export function showAlert({ isVisible, autodismiss, content, data }: { isVisible: boolean; autodismiss: number; content: string; data: string }) {
  return {
    type: 'SHOW_ALERT',
    isVisible,
    autodismiss,
    content,
    data,
  };
}
