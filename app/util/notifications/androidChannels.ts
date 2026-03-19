import { AndroidChannel, AndroidImportance } from '@notifee/react-native';

export enum ChannelId {
  DEFAULT_NOTIFICATION_CHANNEL_ID = 'DEFAULT_NOTIFICATION_CHANNEL_ID',
  ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID = 'ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID',
  SECURITY_NOTIFICATION_CHANNEL_ID = 'SECURITY_NOTIFICATION_CHANNEL_ID',
  PRICE_ALERT_NOTIFICATION_CHANNEL_ID = 'PRICE_ALERT_NOTIFICATION_CHANNEL_ID',
  DAPP_NOTIFICATION_CHANNEL_ID = 'DAPP_NOTIFICATION_CHANNEL_ID',
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
    importance: AndroidImportance.HIGH,
    title: 'Announcement',
    subtitle: 'MetaMask Announcement',
  } as MetaMaskAndroidChannel,
  {
    id: ChannelId.SECURITY_NOTIFICATION_CHANNEL_ID,
    name: 'Security Alert',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    title: 'Security',
    subtitle: 'Security Alert',
  } as MetaMaskAndroidChannel,
  {
    id: ChannelId.PRICE_ALERT_NOTIFICATION_CHANNEL_ID,
    name: 'Price Alert',
    lights: true,
    vibration: true,
    importance: AndroidImportance.DEFAULT,
    title: 'Price Alert',
    subtitle: 'Price Alert',
  } as MetaMaskAndroidChannel,
  {
    id: ChannelId.DAPP_NOTIFICATION_CHANNEL_ID,
    name: 'DApp Notification',
    lights: true,
    vibration: true,
    importance: AndroidImportance.DEFAULT,
    title: 'DApp',
    subtitle: 'DApp Notification',
  } as MetaMaskAndroidChannel,
];
