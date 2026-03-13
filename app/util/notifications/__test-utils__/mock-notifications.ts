import { NotificationServicesController } from '@metamask/notification-services-controller';
import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';

const {
  Processors: { processNotification },
  Mocks,
} = NotificationServicesController;

// Individual factory functions for each notification type
export const createMockNotificationEthSent = () =>
  processNotification(Mocks.createMockNotificationEthSent());
export const createMockNotificationEthReceived = () =>
  processNotification(Mocks.createMockNotificationEthReceived());
export const createMockNotificationERC20Sent = () =>
  processNotification(Mocks.createMockNotificationERC20Sent());
export const createMockNotificationERC20Received = () =>
  processNotification(Mocks.createMockNotificationERC20Received());
export const createMockNotificationERC721Sent = () =>
  processNotification(Mocks.createMockNotificationERC721Sent());
export const createMockNotificationERC721Received = () =>
  processNotification(Mocks.createMockNotificationERC721Received());
export const createMockNotificationERC1155Sent = () =>
  processNotification(Mocks.createMockNotificationERC1155Sent());
export const createMockNotificationERC1155Received = () =>
  processNotification(Mocks.createMockNotificationERC1155Received());
export const createMockNotificationMetaMaskSwapsCompleted = () =>
  processNotification(Mocks.createMockNotificationMetaMaskSwapsCompleted());
export const createMockNotificationRocketPoolStakeCompleted = () =>
  processNotification(Mocks.createMockNotificationRocketPoolStakeCompleted());
export const createMockNotificationRocketPoolUnStakeCompleted = () =>
  processNotification(Mocks.createMockNotificationRocketPoolUnStakeCompleted());
export const createMockNotificationLidoStakeCompleted = () =>
  processNotification(Mocks.createMockNotificationLidoStakeCompleted());
export const createMockNotificationLidoWithdrawalRequested = () =>
  processNotification(Mocks.createMockNotificationLidoWithdrawalRequested());
export const createMockNotificationLidoReadyToBeWithdrawn = () =>
  processNotification(Mocks.createMockNotificationLidoReadyToBeWithdrawn());
export const createMockNotificationLidoWithdrawalCompleted = () =>
  processNotification(Mocks.createMockNotificationLidoWithdrawalCompleted());
export const createMockFeatureAnnouncementRaw = () =>
  processNotification(Mocks.createMockFeatureAnnouncementRaw());

// Pre-built arrays of notifications
export const MOCK_ON_CHAIN_NOTIFICATIONS = [
  createMockNotificationEthSent(),
  createMockNotificationEthReceived(),
  createMockNotificationERC20Sent(),
  createMockNotificationERC20Received(),
  createMockNotificationERC721Sent(),
  createMockNotificationERC721Received(),
  createMockNotificationERC1155Sent(),
  createMockNotificationERC1155Received(),
  createMockNotificationMetaMaskSwapsCompleted(),
  createMockNotificationRocketPoolStakeCompleted(),
  createMockNotificationRocketPoolUnStakeCompleted(),
  createMockNotificationLidoStakeCompleted(),
  createMockNotificationLidoWithdrawalRequested(),
  createMockNotificationLidoReadyToBeWithdrawn(),
  createMockNotificationLidoWithdrawalCompleted(),
];

export const MOCK_FEATURE_ANNOUNCEMENT_NOTIFICATIONS = [
  createMockFeatureAnnouncementRaw(),
];

const MOCK_NOTIFICATIONS = [
  ...MOCK_ON_CHAIN_NOTIFICATIONS,
  ...MOCK_FEATURE_ANNOUNCEMENT_NOTIFICATIONS,
];

export default MOCK_NOTIFICATIONS;

// Helper: map trigger type to its factory function
const TRIGGER_TYPE_TO_FACTORY: Record<string, () => ReturnType<typeof processNotification>> = {
  [TRIGGER_TYPES.ETH_SENT]: createMockNotificationEthSent,
  [TRIGGER_TYPES.ETH_RECEIVED]: createMockNotificationEthReceived,
  [TRIGGER_TYPES.ERC20_SENT]: createMockNotificationERC20Sent,
  [TRIGGER_TYPES.ERC20_RECEIVED]: createMockNotificationERC20Received,
  [TRIGGER_TYPES.ERC721_SENT]: createMockNotificationERC721Sent,
  [TRIGGER_TYPES.ERC721_RECEIVED]: createMockNotificationERC721Received,
  [TRIGGER_TYPES.ERC1155_SENT]: createMockNotificationERC1155Sent,
  [TRIGGER_TYPES.ERC1155_RECEIVED]: createMockNotificationERC1155Received,
  [TRIGGER_TYPES.FEATURES_ANNOUNCEMENT]: createMockFeatureAnnouncementRaw,
  [TRIGGER_TYPES.METAMASK_SWAP_COMPLETED]: createMockNotificationMetaMaskSwapsCompleted,
  [TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED]: createMockNotificationRocketPoolStakeCompleted,
  [TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED]: createMockNotificationRocketPoolUnStakeCompleted,
  [TRIGGER_TYPES.LIDO_STAKE_COMPLETED]: createMockNotificationLidoStakeCompleted,
  [TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED]: createMockNotificationLidoWithdrawalCompleted,
  [TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED]: createMockNotificationLidoWithdrawalRequested,
  [TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN]: createMockNotificationLidoReadyToBeWithdrawn,
};

/**
 * Create a mock notification by trigger type
 */
export const createMockNotificationByType = (triggerType: TRIGGER_TYPES) => {
  const factory = TRIGGER_TYPE_TO_FACTORY[triggerType];
  if (!factory) {
    throw new Error(`No mock factory for trigger type: ${triggerType}`);
  }
  return factory();
};

/**
 * Create a mock notification marked as read
 */
export const createMockReadNotification = (triggerType: TRIGGER_TYPES) => {
  const notification = createMockNotificationByType(triggerType);
  return { ...notification, isRead: true };
};

/**
 * Create a mock notification marked as unread
 */
export const createMockUnreadNotification = (triggerType: TRIGGER_TYPES) => {
  const notification = createMockNotificationByType(triggerType);
  return { ...notification, isRead: false };
};
