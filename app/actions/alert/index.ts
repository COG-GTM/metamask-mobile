import { ReactNode } from 'react';

interface AlertData {
  [key: string]: unknown;
}

interface ShowAlertParams {
  isVisible: boolean;
  autodismiss?: number;
  content?: ReactNode;
  data?: AlertData;
}

interface DismissAlertAction {
  type: 'HIDE_ALERT';
}

interface ShowAlertAction {
  type: 'SHOW_ALERT';
  isVisible: boolean;
  autodismiss?: number;
  content?: ReactNode;
  data?: AlertData;
}

export type AlertAction = DismissAlertAction | ShowAlertAction;

export function dismissAlert(): DismissAlertAction {
  return {
    type: 'HIDE_ALERT',
  };
}

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: ShowAlertParams): ShowAlertAction {
  return {
    type: 'SHOW_ALERT',
    isVisible,
    autodismiss,
    content,
    data,
  };
}
