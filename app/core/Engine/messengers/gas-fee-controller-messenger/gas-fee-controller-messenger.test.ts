import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import type { NetworkState } from '@metamask/network-controller';
import { getGasFeeControllerMessenger } from './gas-fee-controller-messenger';

type BaseMessenger = Parameters<typeof getGasFeeControllerMessenger>[0];

function setup() {
  const baseMessenger: BaseMessenger = new Messenger();
  const getEIP1559Compatibility = jest.fn().mockResolvedValue(true);
  const getNetworkClientById = jest
    .fn()
    .mockReturnValue({ configuration: { chainId: '0x1' } });
  const getState = jest
    .fn()
    .mockReturnValue({ selectedNetworkClientId: 'mainnet' });

  baseMessenger.registerActionHandler(
    'NetworkController:getEIP1559Compatibility',
    getEIP1559Compatibility,
  );
  baseMessenger.registerActionHandler(
    'NetworkController:getNetworkClientById',
    getNetworkClientById,
  );
  baseMessenger.registerActionHandler('NetworkController:getState', getState);

  const messenger = getGasFeeControllerMessenger(baseMessenger);

  return {
    baseMessenger,
    messenger,
    getEIP1559Compatibility,
    getNetworkClientById,
    getState,
  };
}

describe('getGasFeeControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const { messenger } = setup();

    expect(messenger).toBeInstanceOf(RestrictedMessenger);
  });

  it('restricts the messenger to the GasFeeController allow-lists', () => {
    const baseMessenger: BaseMessenger = new Messenger();
    const getRestrictedSpy = jest.spyOn(baseMessenger, 'getRestricted');

    getGasFeeControllerMessenger(baseMessenger);

    expect(getRestrictedSpy).toHaveBeenCalledTimes(1);
    expect(getRestrictedSpy).toHaveBeenCalledWith({
      name: 'GasFeeController',
      allowedActions: [
        'NetworkController:getEIP1559Compatibility',
        'NetworkController:getNetworkClientById',
        'NetworkController:getState',
      ],
      allowedEvents: ['NetworkController:networkDidChange'],
    });
  });

  it('allows calling NetworkController:getEIP1559Compatibility', async () => {
    const { messenger, getEIP1559Compatibility } = setup();

    const result = await messenger.call(
      'NetworkController:getEIP1559Compatibility',
      'mainnet',
    );

    expect(result).toBe(true);
    expect(getEIP1559Compatibility).toHaveBeenCalledWith('mainnet');
  });

  it('allows calling NetworkController:getNetworkClientById', () => {
    const { messenger, getNetworkClientById } = setup();

    const result = messenger.call(
      'NetworkController:getNetworkClientById',
      'mainnet',
    );

    expect(result).toStrictEqual({ configuration: { chainId: '0x1' } });
    expect(getNetworkClientById).toHaveBeenCalledWith('mainnet');
  });

  it('allows calling NetworkController:getState', () => {
    const { messenger, getState } = setup();

    const result = messenger.call('NetworkController:getState');

    expect(result).toStrictEqual({ selectedNetworkClientId: 'mainnet' });
    expect(getState).toHaveBeenCalledTimes(1);
  });

  it('receives NetworkController:networkDidChange events', () => {
    const { baseMessenger, messenger } = setup();
    const listener = jest.fn();
    const networkState = {
      selectedNetworkClientId: 'sepolia',
    } as unknown as NetworkState;

    messenger.subscribe('NetworkController:networkDidChange', listener);
    baseMessenger.publish('NetworkController:networkDidChange', networkState);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(networkState);
  });

  it('rejects actions outside the allow-list', () => {
    const { messenger } = setup();
    const unrestricted = messenger as unknown as {
      call: (action: string) => unknown;
    };

    expect(() =>
      unrestricted.call('NetworkController:setActiveNetwork'),
    ).toThrow('Action missing from allow list');
  });

  it('rejects events outside the allow-list', () => {
    const { messenger } = setup();
    const unrestricted = messenger as unknown as {
      subscribe: (event: string, handler: () => void) => void;
    };

    expect(() =>
      unrestricted.subscribe('NetworkController:stateChange', jest.fn()),
    ).toThrow('Event missing from allow list');
  });
});
