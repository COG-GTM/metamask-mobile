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
    name: 'Default Notifications',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'Default',
    subtitle: 'Default Notifications',
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
    name: 'Transaction Notifications',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'Transaction',
    subtitle: 'Transaction Notifications',
  } as MetaMaskAndroidChannel,
  {
    id: ChannelId.DEFI_CHANNEL_ID,
    name: 'DeFi Notifications',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'DeFi',
    subtitle: 'DeFi Notifications',
  } as MetaMaskAndroidChannel,
  {
    id: ChannelId.STAKING_CHANNEL_ID,
    name: 'Staking Notifications',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'Staking',
    subtitle: 'Staking Notifications',
  } as MetaMaskAndroidChannel,
  {
    id: ChannelId.SECURITY_CHANNEL_ID,
    name: 'Security Alerts',
    lights: true,
    vibration: true,
    importance: AndroidImportance.MAX,
    title: 'Security',
    subtitle: 'Security Alerts',
  } as MetaMaskAndroidChannel,
  {
    id: ChannelId.PRICE_ALERT_CHANNEL_ID,
    name: 'Price Alerts',
    lights: true,
    vibration: true,
    importance: AndroidImportance.DEFAULT,
    title: 'Price Alert',
    subtitle: 'Price Alerts',
  } as MetaMaskAndroidChannel,
  {
    id: ChannelId.GOVERNANCE_CHANNEL_ID,
    name: 'Governance Notifications',
    lights: true,
    vibration: true,
    importance: AndroidImportance.DEFAULT,
    title: 'Governance',
    subtitle: 'Governance Notifications',
  } as MetaMaskAndroidChannel,
];
