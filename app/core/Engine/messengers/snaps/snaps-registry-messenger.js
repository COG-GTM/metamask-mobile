





/**
 * Get a restricted messenger for the Snaps registry. This is scoped to the
 * actions and events that the Snaps registry is allowed to handle.
 *
 * @param controllerMessenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSnapsRegistryMessenger(
controllerMessenger)
{
  return controllerMessenger.getRestricted({
    name: 'SnapsRegistry',
    allowedEvents: [],
    allowedActions: []
  });
}