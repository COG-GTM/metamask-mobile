import { BaseControllerMessenger } from '../../types';
import { getMultichainAssetsRatesControllerMessenger } from './multichain-assets-rates-controller-messenger';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';

describe('getMultichainAssetsRatesControllerMessenger', () => {
  const arrangeMocks = () => {
    const baseMessenger: BaseControllerMessenger =
      new ExtendedControllerMessenger();
    const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');
    return { baseMessenger, mockGetRestricted };
  };

  it('returns a restricted messenger with the correct configuration', () => {
    const { baseMessenger, mockGetRestricted } = arrangeMocks();

    const restrictedMessenger =
      getMultichainAssetsRatesControllerMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledTimes(1);
    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'MultichainAssetsRatesController',
      allowedEvents: [
        'AccountsController:accountAdded',
        'KeyringController:lock',
        'KeyringController:unlock',
        'CurrencyRateController:stateChange',
        'MultichainAssetsController:stateChange',
      ],
      allowedActions: [
        'AccountsController:listMultichainAccounts',
        'SnapController:handleRequest',
        'CurrencyRateController:getState',
        'MultichainAssetsController:getState',
        'AccountsController:getSelectedMultichainAccount',
      ],
    });

    expect(restrictedMessenger).toBeDefined();
  });

  it('delegates allowed actions to handlers registered on the base messenger', () => {
    const { baseMessenger } = arrangeMocks();
    const currencyRateState = { currentCurrency: 'usd' };
    const getCurrencyRateState = jest.fn().mockReturnValue(currencyRateState);
    baseMessenger.registerActionHandler(
      'CurrencyRateController:getState',
      getCurrencyRateState as never,
    );

    const restrictedMessenger =
      getMultichainAssetsRatesControllerMessenger(baseMessenger);

    expect(restrictedMessenger.call('CurrencyRateController:getState')).toBe(
      currencyRateState,
    );
    expect(getCurrencyRateState).toHaveBeenCalledTimes(1);
  });

  it('forwards allowed events published on the base messenger', () => {
    const { baseMessenger } = arrangeMocks();
    const restrictedMessenger =
      getMultichainAssetsRatesControllerMessenger(baseMessenger);
    const onUnlock = jest.fn();
    const onLock = jest.fn();

    restrictedMessenger.subscribe('KeyringController:unlock', onUnlock);
    restrictedMessenger.subscribe('KeyringController:lock', onLock);
    baseMessenger.publish('KeyringController:unlock');
    baseMessenger.publish('KeyringController:lock');

    expect(onUnlock).toHaveBeenCalledTimes(1);
    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it('rejects actions outside the allow-list', () => {
    const { baseMessenger } = arrangeMocks();
    const restrictedMessenger =
      getMultichainAssetsRatesControllerMessenger(baseMessenger);

    expect(() =>
      restrictedMessenger.call(
        // @ts-expect-error - intentionally calling an action that is not allowed
        'KeyringController:getState',
      ),
    ).toThrow('Action missing from allow list: KeyringController:getState');
  });
});
