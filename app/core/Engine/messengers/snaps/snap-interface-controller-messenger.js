

























/**
 * Get a restricted messenger for the Snap interface controller. This is scoped
 * to the actions and events that the Snap interface controller is allowed to
 * handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSnapInterfaceControllerMessenger(
messenger)
{
  return messenger.getRestricted({
    name: 'SnapInterfaceController',
    allowedActions: [
    `PhishingController:maybeUpdateState`,
    `PhishingController:testOrigin`,
    `ApprovalController:hasRequest`,
    `ApprovalController:acceptRequest`,
    `SnapController:get`,
    'AccountsController:getAccountByAddress',
    'MultichainAssetsController:getState'],

    allowedEvents: ['NotificationServicesController:notificationsListUpdated']
  });
}