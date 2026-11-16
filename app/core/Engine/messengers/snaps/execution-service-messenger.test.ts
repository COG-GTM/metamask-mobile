import { RestrictedMessenger } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { getExecutionServiceMessenger } from './execution-service-messenger';

describe('getExecutionServiceMessenger', () => {
  it('returns a restricted messenger with no allowed actions or events', () => {
    const baseMessenger: Parameters<typeof getExecutionServiceMessenger>[0] =
      new ExtendedControllerMessenger();
    const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');

    const restrictedMessenger = getExecutionServiceMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledTimes(1);
    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'ExecutionService',
      allowedEvents: [],
      allowedActions: [],
    });
    expect(restrictedMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
