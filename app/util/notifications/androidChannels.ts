import { AndroidChannel, AndroidImportance } from '@notifee/react-native';

export enum ChannelId {
  /** @deprecated Kept for backward compatibility / fallback. Use a specific channel instead. */
  DEFAULT_NOTIFICATION_CHANNEL_ID = 'DEFAULT_NOTIFICATION_CHANNEL_ID',
  ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID = 'ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID',
  TRANSACTION_CHANNEL_ID = 'TRANSACTION_CHANNEL_ID',
  DEFI_CHANNEL_ID = 'DEFI_CHANNEL_ID',
  STAKING_CHANNEL_ID = 'STAKING_CHANNEL_ID',
  SECURITY_CHANNEL_ID = 'SECURITY_CHANNEL_ID',
  PRICE_ALERT_CHANNEL_ID = 'PRICE_ALERT_CHANNEL_ID',
  GOVERNANCE_CHANNEL_ID = 'GOVERNANCE_CHANNEL_ID',
}

export interface MetaMaskAndroidChannel extends AndroidChannel {
  id: ChannelId;
  title: string;
  subtitle: string;
}

export const notificationChannels: MetaMaskAndroidChannel[] = [
  {
    id: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
    name: 'Transaction Complete',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'Transaction',
    subtitle: 'Transaction Complete',
  },
  {
    id: ChannelId.TRANSACTION_CHANNEL_ID,
    name: 'Transactions',
    description: 'Notifications for transaction confirmations and status updates',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'Transactions',
    subtitle: 'Transaction notifications',
  },
  {
    id: ChannelId.DEFI_CHANNEL_ID,
    name: 'DeFi',
    description: 'Notifications for DeFi activity such as swaps and liquidity events',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'DeFi',
    subtitle: 'DeFi activity notifications',
  },
  {
    id: ChannelId.STAKING_CHANNEL_ID,
    name: 'Staking',
    description: 'Notifications for staking rewards and validator updates',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'Staking',
    subtitle: 'Staking notifications',
  },
  {
    id: ChannelId.SECURITY_CHANNEL_ID,
    name: 'Security Alerts',
    description: 'Critical security notifications such as suspicious activity and approvals',
    lights: true,
    vibration: true,
    importance: AndroidImportance.MAX,
    title: 'Security',
    subtitle: 'Security alert notifications',
  },
  {
    id: ChannelId.PRICE_ALERT_CHANNEL_ID,
    name: 'Price Alerts',
    description: 'Notifications for token price movements and thresholds',
    lights: true,
    vibration: true,
    importance: AndroidImportance.DEFAULT,
    title: 'Price Alerts',
    subtitle: 'Price alert notifications',
  },
  {
    id: ChannelId.GOVERNANCE_CHANNEL_ID,
    name: 'Governance',
    description: 'Notifications for DAO proposals and governance votes',
    lights: true,
    vibration: true,
    importance: AndroidImportance.DEFAULT,
    title: 'Governance',
    subtitle: 'Governance notifications',
  },
  {
    id: ChannelId.ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID,
    name: 'MetaMask Announcement',
    description: 'General announcements from MetaMask',
    lights: true,
    vibration: true,
    importance: AndroidImportance.DEFAULT,
    title: 'Announcement',
    subtitle: 'MetaMask Announcement',
  },
];
