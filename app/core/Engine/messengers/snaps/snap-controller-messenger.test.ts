import { RestrictedMessenger } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import {
  getSnapControllerInitMessenger,
  getSnapControllerMessenger,
} from './snap-controller-messenger';

const arrangeMocks = () => {
  const baseMessenger: Parameters<typeof getSnapControllerMessenger>[0] =
    new ExtendedControllerMessenger();
  const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');
  return { baseMessenger, mockGetRestricted };
};

const arrangeInitMocks = () => {
  const baseMessenger: Parameters<typeof getSnapControllerInitMessenger>[0] =
    new ExtendedControllerMessenger();
  const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');
  return { baseMessenger, mockGetRestricted };
};

describe('getSnapControllerMessenger', () => {
  it('returns a restricted messenger with the correct configuration', () => {
    const { baseMessenger, mockGetRestricted } = arrangeMocks();

    const snapControllerMessenger = getSnapControllerMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledTimes(1);
    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'SnapController',
      allowedEvents: [
        'ExecutionService:unhandledError',
        'ExecutionService:outboundRequest',
        'ExecutionService:outboundResponse',
        'KeyringController:lock',
      ],
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
        'SnapInterfaceController:createInterface',
        'SnapInterfaceController:getInterface',
      ],
    });
    expect(snapControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });

  it('delegates allowed permission actions to the base messenger', () => {
    const { baseMessenger } = arrangeMocks();
    const revokePermissions = jest.fn();
    baseMessenger.registerActionHandler(
      'PermissionController:revokePermissions',
      revokePermissions,
    );

    const snapControllerMessenger = getSnapControllerMessenger(baseMessenger);
    const subjects: Record<string, [string]> = {
      'npm:@metamask/example-snap': ['snap_dialog'],
    };
    snapControllerMessenger.call(
      'PermissionController:revokePermissions',
      subjects,
    );

    expect(revokePermissions).toHaveBeenCalledWith(subjects);
  });
});

describe('getSnapControllerInitMessenger', () => {
  it('returns a restricted messenger with the correct configuration', () => {
    const { baseMessenger, mockGetRestricted } = arrangeInitMocks();

    const snapControllerInitMessenger =
      getSnapControllerInitMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledTimes(1);
    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'SnapControllerInit',
      allowedEvents: [],
      allowedActions: [
        'KeyringController:getKeyringsByType',
        'PreferencesController:getState',
      ],
    });
    expect(snapControllerInitMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
