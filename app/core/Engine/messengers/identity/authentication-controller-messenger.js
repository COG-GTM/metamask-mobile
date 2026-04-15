


export function getAuthenticationControllerMessenger(
baseControllerMessenger)
{
  return baseControllerMessenger.getRestricted({
    name: 'AuthenticationController',
    allowedActions: [
    // Keyring Controller Requests
    'KeyringController:getState',
    // Snap Controller Requests
    'SnapController:handleRequest'],

    allowedEvents: [
    // Keyring Controller Events
    'KeyringController:lock',
    'KeyringController:unlock']

  });
}