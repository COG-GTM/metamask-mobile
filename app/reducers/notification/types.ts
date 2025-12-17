export interface TransactionNotification {
  id: string;
  isVisible: boolean;
  autodismiss: number;
  transaction: {
    id: string;
    [key: string]: unknown;
  };
  status: string;
  type: 'transaction';
}

export interface SimpleNotification {
  id: string;
  isVisible: boolean;
  autodismiss: number;
  title: string;
  description: string;
  status: string;
  type: 'simple';
}

export type Notification = TransactionNotification | SimpleNotification;

export interface NotificationState {
  notifications: Notification[];
}
