import { RestrictedMessenger } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { getCronjobControllerMessenger } from './cronjob-controller-messenger';

describe('getCronjobControllerMessenger', () => {
  const arrangeMocks = () => {
    const baseMessenger: Parameters<typeof getCronjobControllerMessenger>[0] =
      new ExtendedControllerMessenger();
    const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');
    return { baseMessenger, mockGetRestricted };
  };

  it('returns a restricted messenger with the correct configuration', () => {
    const { baseMessenger, mockGetRestricted } = arrangeMocks();

    const cronjobControllerMessenger =
      getCronjobControllerMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledTimes(1);
    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'CronjobController',
      allowedEvents: [
        'SnapController:snapInstalled',
        'SnapController:snapUpdated',
        'SnapController:snapUninstalled',
        'SnapController:snapEnabled',
        'SnapController:snapDisabled',
      ],
      allowedActions: [
        'PermissionController:getPermissions',
        'SnapController:handleRequest',
        'SnapController:getAll',
      ],
    });
    expect(cronjobControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
