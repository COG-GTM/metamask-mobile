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

  it('first channel has DEFAULT_NOTIFICATION_CHANNEL_ID', () => {
    const firstChannel: MetaMaskAndroidChannel = notificationChannels[0];
    expect(firstChannel).toEqual({
      id: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
      name: 'Transaction Complete',
      lights: true,
      vibration: true,
      importance: AndroidImportance.HIGH,
      title: 'Transaction',
      subtitle: 'Transaction Complete',
    });
  });

  it('announcement channel uses DEFAULT importance', () => {
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

  it('transaction channel uses HIGH importance', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.TRANSACTION_CHANNEL_ID,
    );
    expect(channel).toBeDefined();
    expect(channel?.importance).toBe(AndroidImportance.HIGH);
  });

  it('defi channel uses HIGH importance', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.DEFI_CHANNEL_ID,
    );
    expect(channel).toBeDefined();
    expect(channel?.importance).toBe(AndroidImportance.HIGH);
  });

  it('staking channel uses HIGH importance', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.STAKING_CHANNEL_ID,
    );
    expect(channel).toBeDefined();
    expect(channel?.importance).toBe(AndroidImportance.HIGH);
  });

  it('security channel uses MAX importance', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.SECURITY_CHANNEL_ID,
    );
    expect(channel).toBeDefined();
    expect(channel?.importance).toBe(AndroidImportance.MAX);
  });

  it('price alert channel uses DEFAULT importance', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.PRICE_ALERT_CHANNEL_ID,
    );
    expect(channel).toBeDefined();
    expect(channel?.importance).toBe(AndroidImportance.DEFAULT);
  });

  it('governance channel uses DEFAULT importance', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.GOVERNANCE_CHANNEL_ID,
    );
    expect(channel).toBeDefined();
    expect(channel?.importance).toBe(AndroidImportance.DEFAULT);
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

  it('channels have unique subtitles ', () => {
    const subtitles = notificationChannels.map((channel) => channel.subtitle);
    const uniqueSubtitles = new Set(subtitles);
    expect(uniqueSubtitles.size).toBe(subtitles.length);
  });
});
