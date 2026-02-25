import { AlertAction, AlertData } from '../../reducers/alert';

interface ShowAlertParams {
  isVisible: boolean;
  autodismiss: number;
  content: string;
  data: AlertData;
}

export function dismissAlert(): AlertAction {
  return {
    type: 'HIDE_ALERT',
  };
}

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: ShowAlertParams): AlertAction {
  return {
    type: 'SHOW_ALERT',
    isVisible,
    autodismiss,
    content,
    data,
  };
}
