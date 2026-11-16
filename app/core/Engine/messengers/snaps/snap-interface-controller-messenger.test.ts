import { RestrictedMessenger } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { getSnapInterfaceControllerMessenger } from './snap-interface-controller-messenger';

describe('getSnapInterfaceControllerMessenger', () => {
  const arrangeMocks = () => {
    const baseMessenger: Parameters<
      typeof getSnapInterfaceControllerMessenger
    >[0] = new ExtendedControllerMessenger();
    const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');
    return { baseMessenger, mockGetRestricted };
  };

  it('returns a restricted messenger with the correct configuration', () => {
    const { baseMessenger, mockGetRestricted } = arrangeMocks();

    const snapInterfaceControllerMessenger =
      getSnapInterfaceControllerMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledTimes(1);
    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'SnapInterfaceController',
      allowedActions: [
        'PhishingController:maybeUpdateState',
        'PhishingController:testOrigin',
        'ApprovalController:hasRequest',
        'ApprovalController:acceptRequest',
        'SnapController:get',
        'AccountsController:getAccountByAddress',
        'MultichainAssetsController:getState',
      ],
      allowedEvents: [
        'NotificationServicesController:notificationsListUpdated',
      ],
    });
    expect(snapInterfaceControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
