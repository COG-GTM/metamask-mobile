import { AndroidChannel, AndroidImportance } from '@notifee/react-native';

export enum ChannelId {
  /** @deprecated Kept for backward compatibility / fallback. Use a specific channel instead. */
  DEFAULT_NOTIFICATION_CHANNEL_ID = 'DEFAULT_NOTIFICATION_CHANNEL_ID',
  ANNOUNCEMENT_CHANNEL_ID = 'ANNOUNCEMENT_CHANNEL_ID',
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
    name: 'Default Notifications',
    description: 'General MetaMask notifications (legacy fallback)',
    lights: true,
    vibration: true,
    importance: AndroidImportance.DEFAULT,
    title: 'Default',
    subtitle: 'Default Notifications',
  },
  {
    id: ChannelId.TRANSACTION_CHANNEL_ID,
    name: 'Transaction Notifications',
    description: 'Notifications for transaction confirmations and updates',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'Transaction',
    subtitle: 'Transaction Notifications',
  },
  {
    id: ChannelId.DEFI_CHANNEL_ID,
    name: 'DeFi Notifications',
    description: 'Notifications for DeFi activity and updates',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'DeFi',
    subtitle: 'DeFi Notifications',
  },
  {
    id: ChannelId.STAKING_CHANNEL_ID,
    name: 'Staking Notifications',
    description: 'Notifications for staking rewards and status changes',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'Staking',
    subtitle: 'Staking Notifications',
  },
  {
    id: ChannelId.SECURITY_CHANNEL_ID,
    name: 'Security Alerts',
    description: 'Critical security notifications requiring immediate attention',
    lights: true,
    vibration: true,
    importance: AndroidImportance.MAX,
    title: 'Security',
    subtitle: 'Security Alerts',
  },
  {
    id: ChannelId.PRICE_ALERT_CHANNEL_ID,
    name: 'Price Alerts',
    description: 'Notifications for price changes and alerts',
    lights: true,
    vibration: true,
    importance: AndroidImportance.DEFAULT,
    title: 'Price Alert',
    subtitle: 'Price Alerts',
  },
  {
    id: ChannelId.GOVERNANCE_CHANNEL_ID,
    name: 'Governance Notifications',
    description: 'Notifications for governance proposals and voting',
    lights: true,
    vibration: true,
    importance: AndroidImportance.DEFAULT,
    title: 'Governance',
    subtitle: 'Governance Notifications',
  },
  {
    id: ChannelId.ANNOUNCEMENT_CHANNEL_ID,
    name: 'MetaMask Announcements',
    description: 'General announcements from MetaMask',
    lights: true,
    vibration: true,
    importance: AndroidImportance.DEFAULT,
    title: 'Announcement',
    subtitle: 'MetaMask Announcements',
  },
];
