import { BaseControllerMessenger } from '../../types';
import { getMultichainBalancesControllerMessenger } from './multichain-balances-controller-messenger';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';

describe('getMultichainBalancesControllerMessenger', () => {
  const arrangeMocks = () => {
    const baseMessenger: BaseControllerMessenger =
      new ExtendedControllerMessenger();
    const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');
    return { baseMessenger, mockGetRestricted };
  };

  it('returns a restricted messenger with the correct configuration', () => {
    const { baseMessenger, mockGetRestricted } = arrangeMocks();

    const restrictedMessenger =
      getMultichainBalancesControllerMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledTimes(1);
    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'MultichainBalancesController',
      allowedEvents: [
        'AccountsController:accountAdded',
        'AccountsController:accountRemoved',
        'AccountsController:accountBalancesUpdated',
        'MultichainAssetsController:stateChange',
      ],
      allowedActions: [
        'AccountsController:listMultichainAccounts',
        'SnapController:handleRequest',
        'MultichainAssetsController:getState',
        'KeyringController:getState',
      ],
    });

    expect(restrictedMessenger).toBeDefined();
  });

  it('delegates SnapController:handleRequest to the base messenger', async () => {
    const { baseMessenger } = arrangeMocks();
    const handleRequest = jest.fn().mockResolvedValue({ balances: {} });
    baseMessenger.registerActionHandler(
      'SnapController:handleRequest',
      handleRequest,
    );

    const restrictedMessenger =
      getMultichainBalancesControllerMessenger(baseMessenger);
    const request = {
      snapId: 'npm:@solana/solana-wallet-snap',
      origin: 'metamask',
      handler: 'onKeyringRequest',
      request: { method: 'keyring_getAccountBalances' },
    } as Parameters<typeof handleRequest>[0];

    await expect(
      restrictedMessenger.call('SnapController:handleRequest', request),
    ).resolves.toStrictEqual({ balances: {} });
    expect(handleRequest).toHaveBeenCalledWith(request);
  });

  it('forwards AccountsController:accountBalancesUpdated events from the base messenger', () => {
    const { baseMessenger } = arrangeMocks();
    const restrictedMessenger =
      getMultichainBalancesControllerMessenger(baseMessenger);
    const listener = jest.fn();
    restrictedMessenger.subscribe(
      'AccountsController:accountBalancesUpdated',
      listener,
    );

    const payload = {
      balances: {
        'account-id': {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
            amount: '1',
            unit: 'SOL',
          },
        },
      },
    };
    baseMessenger.publish('AccountsController:accountBalancesUpdated', payload);

    expect(listener).toHaveBeenCalledWith(payload);
  });

  it('rejects actions outside the allow-list', () => {
    const { baseMessenger } = arrangeMocks();
    const restrictedMessenger =
      getMultichainBalancesControllerMessenger(baseMessenger);

    expect(() =>
      // @ts-expect-error - not an allowed action
      restrictedMessenger.call('KeyringController:withKeyring'),
    ).toThrow('Action missing from allow list: KeyringController:withKeyring');
  });
});
