import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getSnapInterfaceControllerMessenger } from './snap-interface-controller-messenger';

describe('getSnapInterfaceControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger();
    const snapInterfaceControllerMessenger =
    getSnapInterfaceControllerMessenger(messenger);

    expect(snapInterfaceControllerMessenger).toBeInstanceOf(
      RestrictedMessenger
    );
  });
});