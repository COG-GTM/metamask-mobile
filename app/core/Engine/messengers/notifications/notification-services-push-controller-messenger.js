


export function getNotificationServicesPushControllerMessenger(
baseControllerMessenger)
{
  return baseControllerMessenger.getRestricted({
    name: 'NotificationServicesPushController',
    allowedActions: ['AuthenticationController:getBearerToken'],
    allowedEvents: []
  });
}