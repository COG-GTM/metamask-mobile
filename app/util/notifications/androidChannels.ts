import { AndroidChannel, AndroidImportance } from '@notifee/react-native';

export enum ChannelId {
  /** @deprecated Keep for fallback only */
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

export const notificationChannels = [
  {
    id: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
    name: 'Transaction Complete',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'Transaction',
    subtitle: 'Transaction Complete',
  } as MetaMaskAndroidChannel,
  {
    id: ChannelId.ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID,
    name: 'MetaMask Announcement',
    lights: true,
    vibration: true,
    importance: AndroidImportance.DEFAULT,
    title: 'Announcement',
    subtitle: 'MetaMask Announcement',
  } as MetaMaskAndroidChannel,
  {
    id: ChannelId.TRANSACTION_CHANNEL_ID,
    name: 'Transactions',
    description: 'Notifications for transaction confirmations and updates',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'Transactions',
    subtitle: 'Transaction notifications',
  } as MetaMaskAndroidChannel,
  {
    id: ChannelId.DEFI_CHANNEL_ID,
    name: 'DeFi',
    description: 'Notifications for DeFi activity and updates',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'DeFi',
    subtitle: 'DeFi notifications',
  } as MetaMaskAndroidChannel,
  {
    id: ChannelId.STAKING_CHANNEL_ID,
    name: 'Staking',
    description: 'Notifications for staking rewards and updates',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'Staking',
    subtitle: 'Staking notifications',
  } as MetaMaskAndroidChannel,
  {
    id: ChannelId.SECURITY_CHANNEL_ID,
    name: 'Security',
    description: 'Critical security alerts and warnings',
    lights: true,
    vibration: true,
    importance: AndroidImportance.MAX,
    title: 'Security',
    subtitle: 'Security alerts',
  } as MetaMaskAndroidChannel,
  {
    id: ChannelId.PRICE_ALERT_CHANNEL_ID,
    name: 'Price Alerts',
    description: 'Notifications for price changes and alerts',
    lights: true,
    vibration: true,
    importance: AndroidImportance.DEFAULT,
    title: 'Price Alerts',
    subtitle: 'Price alert notifications',
  } as MetaMaskAndroidChannel,
  {
    id: ChannelId.GOVERNANCE_CHANNEL_ID,
    name: 'Governance',
    description: 'Notifications for governance proposals and votes',
    lights: true,
    vibration: true,
    importance: AndroidImportance.DEFAULT,
    title: 'Governance',
    subtitle: 'Governance notifications',
  } as MetaMaskAndroidChannel,
];
