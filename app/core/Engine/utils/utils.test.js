
























import { merge } from 'lodash';

import { ExtendedControllerMessenger } from '../../ExtendedControllerMessenger';
import { accountsControllerInit } from '../controllers/accounts-controller';
import { currencyRateControllerInit } from '../controllers/currency-rate-controller/currency-rate-controller-init';
import { GasFeeControllerInit } from '../controllers/gas-fee-controller';
import { multichainAssetsControllerInit } from '../controllers/multichain-assets-controller/multichain-assets-controller-init';
import { multichainAssetsRatesControllerInit } from '../controllers/multichain-assets-rates-controller/multichain-assets-rates-controller-init';
import { multichainBalancesControllerInit } from '../controllers/multichain-balances-controller/multichain-balances-controller-init';
import { multichainNetworkControllerInit } from '../controllers/multichain-network-controller/multichain-network-controller-init';
import { multichainTransactionsControllerInit } from '../controllers/multichain-transactions-controller/multichain-transactions-controller-init';
import { notificationServicesControllerInit } from '../controllers/notifications/notification-services-controller-init';
import { notificationServicesPushControllerInit } from '../controllers/notifications/notification-services-push-controller-init';
import { SignatureControllerInit } from '../controllers/signature-controller';
import {
  cronjobControllerInit,
  executionServiceInit,
  snapControllerInit,
  snapInterfaceControllerInit,
  snapsRegistryInit } from
'../controllers/snaps';
import { TransactionControllerInit } from '../controllers/transaction-controller';
import { createMockControllerInitFunction } from './test-utils';
import { getControllerOrThrow, initModularizedControllers } from './utils';

import { appMetadataControllerInit } from '../controllers/app-metadata-controller';

jest.mock('../controllers/accounts-controller');
jest.mock('../controllers/app-metadata-controller');
jest.mock(
  '../controllers/currency-rate-controller/currency-rate-controller-init'
);
jest.mock('../controllers/gas-fee-controller');
jest.mock(
  '../controllers/multichain-assets-controller/multichain-assets-controller-init'
);
jest.mock(
  '../controllers/multichain-assets-rates-controller/multichain-assets-rates-controller-init'
);
jest.mock(
  '../controllers/multichain-balances-controller/multichain-balances-controller-init'
);
jest.mock(
  '../controllers/multichain-network-controller/multichain-network-controller-init'
);
jest.mock(
  '../controllers/multichain-transactions-controller/multichain-transactions-controller-init'
);
jest.mock('../controllers/notifications/notification-services-controller-init');
jest.mock(
  '../controllers/notifications/notification-services-push-controller-init'
);
jest.mock('../controllers/snaps');
jest.mock('../controllers/signature-controller');
jest.mock('../controllers/transaction-controller');

describe('initModularizedControllers', () => {
  const mockAccountsControllerInit = jest.mocked(accountsControllerInit);
  const mockMultichainNetworkControllerInit = jest.mocked(
    multichainNetworkControllerInit
  );
  const mockCurrencyRateControllerInit = jest.mocked(
    currencyRateControllerInit
  );
  const mockCronjobControllerInit = jest.mocked(cronjobControllerInit);
  const mockExecutionServiceInit = jest.mocked(executionServiceInit);
  const mockSnapControllerInit = jest.mocked(snapControllerInit);
  const mockSnapInterfaceControllerInit = jest.mocked(
    snapInterfaceControllerInit
  );
  const mockSnapsRegistryInit = jest.mocked(snapsRegistryInit);
  const mockMultichainAssetsControllerInit = jest.mocked(
    multichainAssetsControllerInit
  );
  const mockMultichainAssetsRatesControllerInit = jest.mocked(
    multichainAssetsRatesControllerInit
  );
  const mockMultichainBalancesControllerInit = jest.mocked(
    multichainBalancesControllerInit
  );
  const mockTransactionControllerInit = jest.mocked(TransactionControllerInit);
  const mockMultichainTransactionsControllerInit = jest.mocked(
    multichainTransactionsControllerInit
  );
  const mockNotificationServicesControllerInit = jest.mocked(
    notificationServicesControllerInit
  );
  const mockNotificationServicesPushControllerInit = jest.mocked(
    notificationServicesPushControllerInit
  );
  const mockGasFeeControllerInit = jest.mocked(GasFeeControllerInit);
  const mockAppMetadataControllerInit = jest.mocked(appMetadataControllerInit);
  const mockSignatureControllerInit = jest.mocked(SignatureControllerInit);
  function buildModularizedControllerRequest(
  overrides)
  {
    return merge(
      {
        existingControllersByName: {},
        controllerInitFunctions: {
          AccountsController: mockAccountsControllerInit,
          CurrencyRateController: mockCurrencyRateControllerInit,
          CronjobController: mockCronjobControllerInit,
          GasFeeController: mockGasFeeControllerInit,
          ExecutionService: mockExecutionServiceInit,
          MultichainNetworkController: mockMultichainNetworkControllerInit,
          MultichainAssetsController: mockMultichainAssetsControllerInit,
          MultichainTransactionsController:
          mockMultichainTransactionsControllerInit,
          MultichainAssetsRatesController:
          mockMultichainAssetsRatesControllerInit,
          MultichainBalancesController: mockMultichainBalancesControllerInit,
          NotificationServicesController:
          mockNotificationServicesControllerInit,
          NotificationServicesPushController:
          mockNotificationServicesPushControllerInit,
          SignatureController: mockSignatureControllerInit,
          SnapController: mockSnapControllerInit,
          SnapInterfaceController: mockSnapInterfaceControllerInit,
          SnapsRegistry: mockSnapsRegistryInit,
          TransactionController: mockTransactionControllerInit,
          AppMetadataController: mockAppMetadataControllerInit
        },
        persistedState: {},
        baseControllerMessenger: new ExtendedControllerMessenger(),
        getGlobalChainId: jest.fn(),
        getState: jest.fn()
      },
      overrides
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();

    mockAccountsControllerInit.mockReturnValue({
      controller: {}
    });
    mockTransactionControllerInit.mockReturnValue({
      controller: {}
    });
    mockMultichainNetworkControllerInit.mockReturnValue({
      controller: {}
    });
    mockCurrencyRateControllerInit.mockReturnValue({
      controller: {}
    });
    mockCronjobControllerInit.mockReturnValue({
      controller: {}
    });
    mockExecutionServiceInit.mockReturnValue({
      controller: {}
    });
    mockSnapControllerInit.mockReturnValue({
      controller: {}
    });
    mockSnapInterfaceControllerInit.mockReturnValue({
      controller: {}
    });
    mockSnapsRegistryInit.mockReturnValue({
      controller: {}
    });
    mockMultichainAssetsControllerInit.mockReturnValue({
      controller: {}
    });
    mockMultichainAssetsRatesControllerInit.mockReturnValue({
      controller: {}
    });
    mockMultichainBalancesControllerInit.mockReturnValue({
      controller: {}
    });
    mockMultichainTransactionsControllerInit.mockReturnValue({
      controller: {}
    });
    mockNotificationServicesControllerInit.mockReturnValue({
      controller: {}
    });
    mockNotificationServicesPushControllerInit.mockReturnValue({
      controller: {}
    });
    mockGasFeeControllerInit.mockReturnValue({
      controller: {}
    });
    mockAppMetadataControllerInit.mockReturnValue({
      controller: {}
    });
    mockSignatureControllerInit.mockReturnValue({
      controller: {}
    });
  });

  it('initializes controllers', () => {
    const request = buildModularizedControllerRequest();
    const controllers = initModularizedControllers(request);

    expect(controllers.controllersByName.AccountsController).toBeDefined();
    expect(
      controllers.controllersByName.MultichainNetworkController
    ).toBeDefined();
    expect(controllers.controllersByName.CurrencyRateController).toBeDefined();
    expect(controllers.controllersByName.CronjobController).toBeDefined();
    expect(
      controllers.controllersByName.MultichainAssetsController
    ).toBeDefined();
    expect(
      controllers.controllersByName.MultichainAssetsRatesController
    ).toBeDefined();
    expect(
      controllers.controllersByName.MultichainBalancesController
    ).toBeDefined();
    expect(
      controllers.controllersByName.MultichainTransactionsController
    ).toBeDefined();
    expect(controllers.controllersByName.TransactionController).toBeDefined();
    expect(controllers.controllersByName.GasFeeController).toBeDefined();
    expect(controllers.controllersByName.SignatureController).toBeDefined();
  });

  it('initializes function including initMessenger', () => {
    const request = buildModularizedControllerRequest();
    initModularizedControllers(request);

    const initMessengerOfTransactionController =
    mockTransactionControllerInit.mock.calls[0][0].initMessenger;

    expect(initMessengerOfTransactionController).toBeDefined();
  });

  it('throws when controller is not found', async () => {
    const request = buildModularizedControllerRequest({
      controllerInitFunctions: {
        AccountsController: createMockControllerInitFunction(


          'NetworkController')
      }
    });
    expect(() => initModularizedControllers(request)).toThrow(
      'Controller requested before it was initialized: NetworkController'
    );
  });

  it('not throws when when existing controller is found', async () => {
    const request = buildModularizedControllerRequest({
      existingControllersByName: {
        NetworkController: jest.fn()
      }
    });

    expect(() => initModularizedControllers(request)).not.toThrow();
  });
});

describe('getControllerOrThrow', () => {
  it('throws when controller is not found', () => {
    expect(() =>
    getControllerOrThrow({
      controller: undefined,
      name: 'AccountsController'
    })
    ).toThrow();
  });

  it('not throws when controller is found', () => {
    expect(() =>
    getControllerOrThrow({
      controller: jest.fn(),
      name: 'AccountsController'
    })
    ).not.toThrow();
  });
});