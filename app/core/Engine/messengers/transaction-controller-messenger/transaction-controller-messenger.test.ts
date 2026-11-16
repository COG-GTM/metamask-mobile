import { Messenger } from '@metamask/base-controller';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import {
  getTransactionControllerInitMessenger,
  getTransactionControllerMessenger,
} from './transaction-controller-messenger';

const TRANSACTION_CONTROLLER_ALLOWED_ACTIONS = [
  'AccountsController:getSelectedAccount',
  'AccountsController:getState',
  'ApprovalController:addRequest',
  'NetworkController:findNetworkClientIdByChainId',
  'NetworkController:getNetworkClientById',
  'RemoteFeatureFlagController:getState',
];

const TRANSACTION_CONTROLLER_ALLOWED_EVENTS = ['NetworkController:stateChange'];

const TRANSACTION_CONTROLLER_INIT_ALLOWED_ACTIONS = [
  'ApprovalController:addRequest',
  'ApprovalController:endFlow',
  'ApprovalController:startFlow',
  'ApprovalController:updateRequestState',
  'NetworkController:getEIP1559Compatibility',
];

const TRANSACTION_CONTROLLER_INIT_ALLOWED_EVENTS = [
  'TransactionController:transactionApproved',
  'TransactionController:transactionConfirmed',
  'TransactionController:transactionDropped',
  'TransactionController:transactionFailed',
  'TransactionController:transactionRejected',
  'TransactionController:transactionSubmitted',
  'TransactionController:unapprovedTransactionAdded',
  'SmartTransactionsController:smartTransaction',
  'SmartTransactionsController:smartTransactionConfirmationDone',
];

type BaseMessenger = Parameters<
  typeof getTransactionControllerInitMessenger
>[0];
type MessengerTypes<M> = M extends Messenger<infer Actions, infer Events>
  ? { actions: Actions; events: Events }
  : never;
type BaseMessengerTypes = MessengerTypes<BaseMessenger>;

interface UntypedMessenger {
  call: (action: string, ...args: unknown[]) => unknown;
  subscribe: (event: string, handler: (...args: unknown[]) => void) => void;
  publish: (event: string, ...payload: unknown[]) => void;
}

const asUntyped = (messenger: unknown) => messenger as UntypedMessenger;

const arrangeMocks = () => {
  const baseMessenger = new ExtendedControllerMessenger<
    BaseMessengerTypes['actions'],
    BaseMessengerTypes['events']
  >();
  const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');
  return { baseMessenger, mockGetRestricted };
};

describe('getTransactionControllerMessenger', () => {
  it('returns a restricted messenger with the correct configuration', () => {
    const { baseMessenger, mockGetRestricted } = arrangeMocks();

    const restrictedMessenger =
      getTransactionControllerMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledTimes(1);
    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'TransactionController',
      allowedActions: TRANSACTION_CONTROLLER_ALLOWED_ACTIONS,
      allowedEvents: TRANSACTION_CONTROLLER_ALLOWED_EVENTS,
    });
    expect(restrictedMessenger).toBeDefined();
  });

  it('forwards allowed actions to the base messenger', () => {
    const { baseMessenger } = arrangeMocks();
    const getStateHandler = jest.fn().mockReturnValue({ flags: true });
    baseMessenger.registerActionHandler(
      'RemoteFeatureFlagController:getState',
      getStateHandler,
    );

    const restrictedMessenger = asUntyped(
      getTransactionControllerMessenger(baseMessenger),
    );

    expect(
      restrictedMessenger.call('RemoteFeatureFlagController:getState'),
    ).toEqual({ flags: true });
    expect(getStateHandler).toHaveBeenCalledTimes(1);
  });

  it('rejects actions reserved for the init messenger', () => {
    const { baseMessenger } = arrangeMocks();
    baseMessenger.registerActionHandler(
      'ApprovalController:startFlow',
      jest.fn(),
    );

    const restrictedMessenger = asUntyped(
      getTransactionControllerMessenger(baseMessenger),
    );

    expect(() =>
      restrictedMessenger.call('ApprovalController:startFlow'),
    ).toThrow(/ApprovalController:startFlow/u);
  });
});

describe('getTransactionControllerInitMessenger', () => {
  it('returns a restricted messenger with the correct configuration', () => {
    const { baseMessenger, mockGetRestricted } = arrangeMocks();

    const restrictedMessenger =
      getTransactionControllerInitMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledTimes(1);
    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'TransactionControllerInit',
      allowedActions: TRANSACTION_CONTROLLER_INIT_ALLOWED_ACTIONS,
      allowedEvents: TRANSACTION_CONTROLLER_INIT_ALLOWED_EVENTS,
    });
    expect(restrictedMessenger).toBeDefined();
  });

  it.each([
    ['ApprovalController:startFlow', { id: 'flow-1', loadingText: null }],
    ['ApprovalController:endFlow', undefined],
    ['NetworkController:getEIP1559Compatibility', true],
  ] as const)('forwards %s to the base messenger', (action, result) => {
    const { baseMessenger } = arrangeMocks();
    const handler = jest.fn().mockReturnValue(result);
    baseMessenger.registerActionHandler(action, handler);

    const initMessenger = asUntyped(
      getTransactionControllerInitMessenger(baseMessenger),
    );

    expect(initMessenger.call(action)).toEqual(result);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it.each(TRANSACTION_CONTROLLER_INIT_ALLOWED_EVENTS)(
    'delivers %s to init messenger subscribers',
    (eventType) => {
      const { baseMessenger } = arrangeMocks();
      const initMessenger = asUntyped(
        getTransactionControllerInitMessenger(baseMessenger),
      );
      const listener = jest.fn();
      const payload = { id: 'tx-1' };

      initMessenger.subscribe(eventType, listener);
      asUntyped(baseMessenger).publish(eventType, payload);

      expect(listener).toHaveBeenCalledWith(payload);
    },
  );

  it('rejects actions reserved for the controller messenger', () => {
    const { baseMessenger } = arrangeMocks();
    baseMessenger.registerActionHandler(
      'AccountsController:getSelectedAccount',
      jest.fn(),
    );

    const initMessenger = asUntyped(
      getTransactionControllerInitMessenger(baseMessenger),
    );

    expect(() =>
      initMessenger.call('AccountsController:getSelectedAccount'),
    ).toThrow(/AccountsController:getSelectedAccount/u);
  });
});
