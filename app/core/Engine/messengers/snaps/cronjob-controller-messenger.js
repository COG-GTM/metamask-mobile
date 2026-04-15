
























/**
 * Get a restricted messenger for the cronjob controller. This is scoped to the
 * actions and events that the cronjob controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getCronjobControllerMessenger(
messenger)
{
  return messenger.getRestricted({
    name: 'CronjobController',
    allowedEvents: [
    'SnapController:snapInstalled',
    'SnapController:snapUpdated',
    'SnapController:snapUninstalled',
    'SnapController:snapEnabled',
    'SnapController:snapDisabled'],

    allowedActions: [
    `PermissionController:getPermissions`,
    'SnapController:handleRequest',
    'SnapController:getAll']

  });
}