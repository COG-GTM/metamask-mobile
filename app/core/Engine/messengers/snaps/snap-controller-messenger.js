













































































/**
 * Get a restricted messenger for the Snap controller. This is scoped to the
 * actions and events that the Snap controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSnapControllerMessenger(
messenger)
{
  return messenger.getRestricted({
    name: 'SnapController',
    allowedEvents: [
    'ExecutionService:unhandledError',
    'ExecutionService:outboundRequest',
    'ExecutionService:outboundResponse',
    'KeyringController:lock'],

    allowedActions: [
    'PermissionController:getEndowments',
    'PermissionController:getPermissions',
    'PermissionController:hasPermission',
    'PermissionController:hasPermissions',
    'PermissionController:requestPermissions',
    'PermissionController:revokeAllPermissions',
    'PermissionController:revokePermissions',
    'PermissionController:revokePermissionForAllSubjects',
    'PermissionController:getSubjectNames',
    'PermissionController:updateCaveat',
    'ApprovalController:addRequest',
    'ApprovalController:updateRequestState',
    'PermissionController:grantPermissions',
    'SubjectMetadataController:getSubjectMetadata',
    'SubjectMetadataController:addSubjectMetadata',
    'ExecutionService:executeSnap',
    'ExecutionService:terminateSnap',
    'ExecutionService:terminateAllSnaps',
    'ExecutionService:handleRpcRequest',
    'SnapsRegistry:get',
    'SnapsRegistry:getMetadata',
    'SnapsRegistry:update',
    'SnapsRegistry:resolveVersion',
    `SnapInterfaceController:createInterface`,
    `SnapInterfaceController:getInterface`]

  });
}









/**
 * Get a restricted messenger for the Snap controller init. This is scoped to
 * the actions and events that the Snap controller init is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSnapControllerInitMessenger(
messenger)
{
  return messenger.getRestricted({
    name: 'SnapControllerInit',
    allowedEvents: [],
    allowedActions: [
    'KeyringController:getKeyringsByType',
    'PreferencesController:getState']

  });
}