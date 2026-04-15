import {


  Controller as NotificationServicesController } from
'@metamask/notification-services-controller/notification-services';

export const createNotificationServicesController = (props) =>


{
  const notificationServicesController = new NotificationServicesController({
    messenger: props.messenger,
    state: props.initialState,
    env: {
      featureAnnouncements: {
        platform: 'mobile',
        accessToken: process.env.FEATURES_ANNOUNCEMENTS_ACCESS_TOKEN ?? '',
        spaceId: process.env.FEATURES_ANNOUNCEMENTS_SPACE_ID ?? ''
      }
    }
  });
  return notificationServicesController;
};