import { RestrictedMessenger } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { getSnapsRegistryMessenger } from './snaps-registry-messenger';

describe('getSnapsRegistryMessenger', () => {
  it('returns a restricted messenger with no allowed actions or events', () => {
    const baseMessenger: Parameters<typeof getSnapsRegistryMessenger>[0] =
      new ExtendedControllerMessenger();
    const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');

    const restrictedMessenger = getSnapsRegistryMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledTimes(1);
    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'SnapsRegistry',
      allowedEvents: [],
      allowedActions: [],
    });
    expect(restrictedMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
