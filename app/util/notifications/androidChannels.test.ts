import { AndroidImportance } from '@notifee/react-native';
import {
  ChannelId,
  MetaMaskAndroidChannel,
  notificationChannels,
} from './androidChannels';

describe('notificationChannels', () => {
  it('contains eight channels', () => {
    expect(notificationChannels).toHaveLength(8);
  });

  it('DEFAULT_NOTIFICATION_CHANNEL_ID has correct properties', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
    ) as MetaMaskAndroidChannel;
    expect(channel).toEqual({
      id: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
      name: 'Default Notifications',
      description: 'General MetaMask notifications (legacy fallback)',
      lights: true,
      vibration: true,
      importance: AndroidImportance.DEFAULT,
      title: 'Default',
      subtitle: 'Default Notifications',
    });
  });

  it('TRANSACTION_CHANNEL_ID has correct properties', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.TRANSACTION_CHANNEL_ID,
    ) as MetaMaskAndroidChannel;
    expect(channel).toEqual({
      id: ChannelId.TRANSACTION_CHANNEL_ID,
      name: 'Transaction Notifications',
      description: 'Notifications for transaction confirmations and updates',
      lights: true,
      vibration: true,
      importance: AndroidImportance.HIGH,
      title: 'Transaction',
      subtitle: 'Transaction Notifications',
    });
  });

  it('DEFI_CHANNEL_ID has correct properties', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.DEFI_CHANNEL_ID,
    ) as MetaMaskAndroidChannel;
    expect(channel).toEqual({
      id: ChannelId.DEFI_CHANNEL_ID,
      name: 'DeFi Notifications',
      description: 'Notifications for DeFi activity and updates',
      lights: true,
      vibration: true,
      importance: AndroidImportance.HIGH,
      title: 'DeFi',
      subtitle: 'DeFi Notifications',
    });
  });

  it('STAKING_CHANNEL_ID has correct properties', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.STAKING_CHANNEL_ID,
    ) as MetaMaskAndroidChannel;
    expect(channel).toEqual({
      id: ChannelId.STAKING_CHANNEL_ID,
      name: 'Staking Notifications',
      description: 'Notifications for staking rewards and status changes',
      lights: true,
      vibration: true,
      importance: AndroidImportance.HIGH,
      title: 'Staking',
      subtitle: 'Staking Notifications',
    });
  });

  it('SECURITY_CHANNEL_ID has correct properties with HIGH importance', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.SECURITY_CHANNEL_ID,
    ) as MetaMaskAndroidChannel;
    expect(channel).toEqual({
      id: ChannelId.SECURITY_CHANNEL_ID,
      name: 'Security Alerts',
      description:
        'Critical security notifications requiring immediate attention',
      lights: true,
      vibration: true,
      importance: AndroidImportance.HIGH,
      title: 'Security',
      subtitle: 'Security Alerts',
    });
  });

  it('PRICE_ALERT_CHANNEL_ID has correct properties', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.PRICE_ALERT_CHANNEL_ID,
    ) as MetaMaskAndroidChannel;
    expect(channel).toEqual({
      id: ChannelId.PRICE_ALERT_CHANNEL_ID,
      name: 'Price Alerts',
      description: 'Notifications for price changes and alerts',
      lights: true,
      vibration: true,
      importance: AndroidImportance.DEFAULT,
      title: 'Price Alert',
      subtitle: 'Price Alerts',
    });
  });

  it('GOVERNANCE_CHANNEL_ID has correct properties', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.GOVERNANCE_CHANNEL_ID,
    ) as MetaMaskAndroidChannel;
    expect(channel).toEqual({
      id: ChannelId.GOVERNANCE_CHANNEL_ID,
      name: 'Governance Notifications',
      description: 'Notifications for governance proposals and voting',
      lights: true,
      vibration: true,
      importance: AndroidImportance.DEFAULT,
      title: 'Governance',
      subtitle: 'Governance Notifications',
    });
  });

  it('ANNOUNCEMENT_CHANNEL_ID has correct properties', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.ANNOUNCEMENT_CHANNEL_ID,
    ) as MetaMaskAndroidChannel;
    expect(channel).toEqual({
      id: ChannelId.ANNOUNCEMENT_CHANNEL_ID,
      name: 'MetaMask Announcements',
      description: 'General announcements from MetaMask',
      lights: true,
      vibration: true,
      importance: AndroidImportance.DEFAULT,
      title: 'Announcement',
      subtitle: 'MetaMask Announcements',
    });
  });

  it('channels have unique titles', () => {
    const titles = notificationChannels.map((channel) => channel.title);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);
  });

  it('channels have unique subtitles ', () => {
    const subtitles = notificationChannels.map((channel) => channel.subtitle);
    const uniqueSubtitles = new Set(subtitles);
    expect(uniqueSubtitles.size).toBe(subtitles.length);
  });

  it('all channels have lights and vibration enabled', () => {
    notificationChannels.forEach((channel) => {
      expect(channel.lights).toBe(true);
      expect(channel.vibration).toBe(true);
    });
  });
});
