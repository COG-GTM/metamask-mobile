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

  it('DEFAULT_NOTIFICATION_CHANNEL_ID channel is kept as fallback', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
    );
    expect(channel).toEqual({
      id: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
      name: 'Transaction Complete',
      lights: true,
      vibration: true,
      importance: AndroidImportance.HIGH,
      title: 'Transaction',
      subtitle: 'Transaction Complete',
    });
  });

  it('TRANSACTION_CHANNEL_ID uses HIGH importance', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.TRANSACTION_CHANNEL_ID,
    );
    expect(channel).toBeDefined();
    expect(channel?.importance).toBe(AndroidImportance.HIGH);
    expect(channel?.lights).toBe(true);
    expect(channel?.vibration).toBe(true);
  });

  it('DEFI_CHANNEL_ID uses HIGH importance', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.DEFI_CHANNEL_ID,
    );
    expect(channel).toBeDefined();
    expect(channel?.importance).toBe(AndroidImportance.HIGH);
    expect(channel?.lights).toBe(true);
    expect(channel?.vibration).toBe(true);
  });

  it('STAKING_CHANNEL_ID uses HIGH importance', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.STAKING_CHANNEL_ID,
    );
    expect(channel).toBeDefined();
    expect(channel?.importance).toBe(AndroidImportance.HIGH);
    expect(channel?.lights).toBe(true);
    expect(channel?.vibration).toBe(true);
  });

  it('SECURITY_CHANNEL_ID uses HIGH importance', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.SECURITY_CHANNEL_ID,
    );
    expect(channel).toBeDefined();
    expect(channel?.importance).toBe(AndroidImportance.HIGH);
    expect(channel?.lights).toBe(true);
    expect(channel?.vibration).toBe(true);
  });

  it('PRICE_ALERT_CHANNEL_ID uses DEFAULT importance', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.PRICE_ALERT_CHANNEL_ID,
    );
    expect(channel).toBeDefined();
    expect(channel?.importance).toBe(AndroidImportance.DEFAULT);
    expect(channel?.lights).toBe(true);
    expect(channel?.vibration).toBe(true);
  });

  it('GOVERNANCE_CHANNEL_ID uses DEFAULT importance', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.GOVERNANCE_CHANNEL_ID,
    );
    expect(channel).toBeDefined();
    expect(channel?.importance).toBe(AndroidImportance.DEFAULT);
    expect(channel?.lights).toBe(true);
    expect(channel?.vibration).toBe(true);
  });

  it('ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID uses DEFAULT importance', () => {
    const channel = notificationChannels.find(
      (c) => c.id === ChannelId.ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID,
    );
    expect(channel).toBeDefined();
    expect(channel?.importance).toBe(AndroidImportance.DEFAULT);
    expect(channel?.lights).toBe(true);
    expect(channel?.vibration).toBe(true);
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

  it('all channels have description, lights, and vibration configured', () => {
    notificationChannels.forEach((channel) => {
      expect(channel.name).toBeDefined();
      expect(channel.lights).toBe(true);
      expect(channel.vibration).toBe(true);
      expect(channel.importance).toBeDefined();
      expect(channel.title).toBeDefined();
      expect(channel.subtitle).toBeDefined();
    });
  });
});
