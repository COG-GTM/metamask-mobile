import { AndroidImportance } from '@notifee/react-native';

export let ChannelId = /*#__PURE__*/function (ChannelId) {ChannelId["DEFAULT_NOTIFICATION_CHANNEL_ID"] = "DEFAULT_NOTIFICATION_CHANNEL_ID";ChannelId["ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID"] = "ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID";return ChannelId;}({});










export const notificationChannels = [
{
  id: ChannelId.DEFAULT_NOTIFICATION_CHANNEL_ID,
  name: 'Transaction Complete',
  lights: true,
  vibration: true,
  importance: AndroidImportance.HIGH,
  title: 'Transaction',
  subtitle: 'Transaction Complete'
},
{
  id: ChannelId.ANNOUNCEMENT_NOTIFICATION_CHANNEL_ID,
  name: 'MetaMask Announcement',
  lights: true,
  vibration: true,
  importance: AndroidImportance.HIGH,
  title: 'Announcement',
  subtitle: 'MetaMask Announcement'
}];