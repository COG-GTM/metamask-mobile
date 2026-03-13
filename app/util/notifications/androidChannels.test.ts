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

  it('DEFAULT_NOTIFICATION_CHANNEL_ID channel has correct properties', () => {
    const channel: MetaMaskAndroidChannel = notificationChannels[0];
    expect(channel).toEqual({
      id: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
      name: 'Default Notifications',
      lights: true,
      vibration: true,
      importance: AndroidImportance.HIGH,
      title: 'Default',
      subtitle: 'Default Notifications',
    });
  });

  it('ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID channel has correct properties', () => {
    const channel: MetaMaskAndroidChannel = notificationChannels[1];
    expect(channel).toEqual({
      id: ChannelId.ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID,
      name: 'MetaMask Announcement',
      lights: true,
      vibration: true,
      importance: AndroidImportance.DEFAULT,
      title: 'Announcement',
      subtitle: 'MetaMask Announcement',
    });
  });

  it('TRANSACTION_CHANNEL_ID channel has correct properties', () => {
    const channel: MetaMaskAndroidChannel = notificationChannels[2];
    expect(channel).toEqual({
      id: ChannelId.TRANSACTION_CHANNEL_ID,
      name: 'Transaction Notifications',
      lights: true,
      vibration: true,
      importance: AndroidImportance.HIGH,
      title: 'Transaction',
      subtitle: 'Transaction Notifications',
    });
  });

  it('DEFI_CHANNEL_ID channel has correct properties', () => {
    const channel: MetaMaskAndroidChannel = notificationChannels[3];
    expect(channel).toEqual({
      id: ChannelId.DEFI_CHANNEL_ID,
      name: 'DeFi Notifications',
      lights: true,
      vibration: true,
      importance: AndroidImportance.HIGH,
      title: 'DeFi',
      subtitle: 'DeFi Notifications',
    });
  });

  it('STAKING_CHANNEL_ID channel has correct properties', () => {
    const channel: MetaMaskAndroidChannel = notificationChannels[4];
    expect(channel).toEqual({
      id: ChannelId.STAKING_CHANNEL_ID,
      name: 'Staking Notifications',
      lights: true,
      vibration: true,
      importance: AndroidImportance.HIGH,
      title: 'Staking',
      subtitle: 'Staking Notifications',
    });
  });

  it('SECURITY_CHANNEL_ID channel has correct properties with MAX importance', () => {
    const channel: MetaMaskAndroidChannel = notificationChannels[5];
    expect(channel).toEqual({
      id: ChannelId.SECURITY_CHANNEL_ID,
      name: 'Security Alerts',
      lights: true,
      vibration: true,
      importance: AndroidImportance.MAX,
      title: 'Security',
      subtitle: 'Security Alerts',
    });
  });

  it('PRICE_ALERT_CHANNEL_ID channel has correct properties', () => {
    const channel: MetaMaskAndroidChannel = notificationChannels[6];
    expect(channel).toEqual({
      id: ChannelId.PRICE_ALERT_CHANNEL_ID,
      name: 'Price Alerts',
      lights: true,
      vibration: true,
      importance: AndroidImportance.DEFAULT,
      title: 'Price Alert',
      subtitle: 'Price Alerts',
    });
  });

  it('GOVERNANCE_CHANNEL_ID channel has correct properties', () => {
    const channel: MetaMaskAndroidChannel = notificationChannels[7];
    expect(channel).toEqual({
      id: ChannelId.GOVERNANCE_CHANNEL_ID,
      name: 'Governance Notifications',
      lights: true,
      vibration: true,
      importance: AndroidImportance.DEFAULT,
      title: 'Governance',
      subtitle: 'Governance Notifications',
    });
  });

  it('all channels have lights and vibration enabled', () => {
    notificationChannels.forEach((channel) => {
      expect(channel.lights).toBe(true);
      expect(channel.vibration).toBe(true);
    });
  });

  it('channels have unique titles', () => {
    const titles = notificationChannels.map((channel) => channel.title);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);
  });

  it('channels have unique subtitles', () => {
    const subtitles = notificationChannels.map((channel) => channel.subtitle);
    const uniqueSubtitles = new Set(subtitles);
    expect(uniqueSubtitles.size).toBe(subtitles.length);
  });
});
