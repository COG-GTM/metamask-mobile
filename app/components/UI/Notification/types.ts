import { NotificationTypesType } from '../../../util/notifications';

export interface CurrentNotification {
  id?: string;
  isVisible?: boolean;
  autodismiss?: number;
  type?: NotificationTypesType;
  title?: string;
  description?: string;
  status?: string;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction?: any;
}
