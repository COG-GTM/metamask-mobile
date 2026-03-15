import { NotificationServicesController } from '@metamask/notification-services-controller';

const {
  Processors: { processNotification },
  Mocks,
} = NotificationServicesController;

// --- Individual factory functions (processed notifications) ---

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

// --- Aggregate collections ---

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

export const MOCK_ALL_NOTIFICATIONS = [
  ...MOCK_ON_CHAIN_NOTIFICATIONS,
  ...MOCK_FEATURE_ANNOUNCEMENT_NOTIFICATIONS,
];

// --- Helpers for creating notifications in various states ---

export const createReadNotification = (
  factoryFn: () => ReturnType<typeof processNotification>,
) => {
  const notification = factoryFn();
  return { ...notification, isRead: true };
};

export const createUnreadNotification = (
  factoryFn: () => ReturnType<typeof processNotification>,
) => {
  const notification = factoryFn();
  return { ...notification, isRead: false };
};

export const createNotificationByTriggerType = (
  triggerType: string,
) => {
  const notification = MOCK_ON_CHAIN_NOTIFICATIONS.find(
    (n) => n.type === triggerType,
  );
  return notification ?? MOCK_ON_CHAIN_NOTIFICATIONS[0];
};

export default MOCK_ALL_NOTIFICATIONS;
