import { NotificationTypes } from '../../../../../../util/notifications';
import { IconName, IconSize } from '../../../../Icons/Icon/Icon.types';

// Internal dependencies.


// Test IDs
export const BADGE_NOTIFICATIONS_TEST_ID = 'badge-notifications';
export const TEST_NOTIFICATIONS_ACTION = NotificationTypes.TRANSACTION;
export const TEST_NOTIFICATIONS_ICON_NAME = IconName.Send;

// Defaults
export const DEFAULT_BADGENOTIFICATIONS_NOTIFICATIONSICON_SIZE = IconSize.Md;

export const SAMPLE_BADGENOTIFICATIONS_PROPS = {
  iconName: TEST_NOTIFICATIONS_ICON_NAME
};