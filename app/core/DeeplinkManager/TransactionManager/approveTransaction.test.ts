/* eslint-disable import/no-namespace */
import * as AddressUtilsModule from '../../../util/address';
import * as TransactionsUtilsModule from '../../../util/transactions';
import Engine from '../../Engine';
import NotificationManager from '../../NotificationManager';
import approveTransaction from './approveTransaction';
import { addTransaction } from '../../../util/transaction-controller';
import { createMockInternalAccount } from '../../../util/test/accountsControllerTestUtils';

const MOCK_SENDER_ADDRESS = '0xMockSenderAddress';
const MOCK_TARGET_ADDRESS = '0xTargetAddress';

const MOCK_INTERNAL_ACCOUNT = createMockInternalAccount(
  MOCK_SENDER_ADDRESS,
  'Account 1',
);

jest.mock('../../../util/networks/global-network', () => ({
  getGlobalNetworkClientId: jest.fn(() => 'selectedNetworkClientId'),
}));
jest.mock('../../../util/transactions');
jest.mock('../../../util/address');
jest.mock('../../Engine', () => ({
  context: {
    NetworkController: {
      setProviderType: jest.fn(),
      setActiveNetwork: jest.fn(),
      findNetworkClientIdByChainId: jest.fn(),
    },
    MultichainNetworkController: {
      setActiveNetwork: jest.fn(),
    },
    PreferencesController: {
      state: { selectedAddress: MOCK_SENDER_ADDRESS },
    },
    TransactionController: {
      addTransaction: jest.fn(),
    },
    AccountsController: {
      internalAccounts: MOCK_INTERNAL_ACCOUNT,
      getSelectedAccount: jest.fn(() => MOCK_INTERNAL_ACCOUNT),
    },
  },
}));
jest.mock('../../NotificationManager');
jest.mock('../../../../locales/i18n', () => ({
  strings: jest.fn().mockImplementation((key) => key),
}));
jest.mock('../../../util/transaction-controller', () => ({
  __esModule: true,
  addTransaction: jest.fn(),
}));

const mockEthUrl = {
  parameters: { uint256: '123', address: '0xMockAddress' },
  target_address: MOCK_TARGET_ADDRESS,
  chain_id: '1',
};
const mockDeeplinkManager = {
  navigation: {
    navigate: jest.fn(),
  },
};

const mockOrigin = 'testOrigin';

describe('approveTransaction', () => {
  const spyGenerateApproveData = jest.spyOn(
    TransactionsUtilsModule,
    'generateApprovalData',
  );

  const mockFindNetworkClientIdByChainId = Engine.context.NetworkController
    .findNetworkClientIdByChainId as jest.Mock;

  const spyAddTransaction = addTransaction as jest.Mock;

  const spyGetAddress = jest.spyOn(AddressUtilsModule, 'getAddress');

  const spyShowSimpleNotification = jest.spyOn(
    NotificationManager,
    'showSimpleNotification',
  );

  beforeEach(() => {
    jest.clearAllMocks();

    spyGenerateApproveData.mockReturnValue('fakeApproveData');
    spyGetAddress.mockResolvedValue('0xMockAddress');
    mockFindNetworkClientIdByChainId.mockReturnValue('mainnet');
  });

  it('does not change the selected network', async () => {
    await approveTransaction({
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deeplinkManager: mockDeeplinkManager as any,
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ethUrl: { ...mockEthUrl, chain_id: '137' } as any,
      origin: mockOrigin,
    });

    expect(
      Engine.context.NetworkController.setProviderType,
    ).not.toHaveBeenCalled();
    expect(
      Engine.context.NetworkController.setActiveNetwork,
    ).not.toHaveBeenCalled();
    expect(
      Engine.context.MultichainNetworkController.setActiveNetwork,
    ).not.toHaveBeenCalled();
  });

  it('adds the transaction on the network client of the deeplink chain', async () => {
    mockFindNetworkClientIdByChainId.mockReturnValue('polygonClientId');

    await approveTransaction({
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deeplinkManager: mockDeeplinkManager as any,
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ethUrl: { ...mockEthUrl, chain_id: '137' } as any,
      origin: mockOrigin,
    });

    expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith('0x89');
    expect(spyAddTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ networkClientId: 'polygonClientId' }),
    );
  });

  it('uses the selected network client when the deeplink has no chain id', async () => {
    await approveTransaction({
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deeplinkManager: mockDeeplinkManager as any,
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ethUrl: { ...mockEthUrl, chain_id: undefined } as any,
      origin: mockOrigin,
    });

    expect(mockFindNetworkClientIdByChainId).not.toHaveBeenCalled();
    expect(spyAddTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ networkClientId: 'selectedNetworkClientId' }),
    );
  });

  it.each([
    ['returns undefined', () => undefined],
    [
      'throws',
      () => {
        throw new Error('No network client');
      },
    ],
  ])(
    'throws an unknown network error without adding a transaction when the lookup %s',
    async (_, implementation) => {
      mockFindNetworkClientIdByChainId.mockImplementation(implementation);

      await expect(
        approveTransaction({
          // TODO: Replace "any" with type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          deeplinkManager: mockDeeplinkManager as any,
          // TODO: Replace "any" with type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ethUrl: { ...mockEthUrl, chain_id: '999999' } as any,
          origin: mockOrigin,
        }),
      ).rejects.toThrow('Unknown network with id 999999');

      expect(spyAddTransaction).not.toHaveBeenCalled();
    },
  );

  it('calls generateApprovalData with the correct parameters', async () => {
    spyGetAddress.mockResolvedValue('0xMockAddress');

    await approveTransaction({
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deeplinkManager: mockDeeplinkManager as any,
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ethUrl: mockEthUrl as any,
      origin: mockOrigin,
    });

    expect(spyGenerateApproveData).toHaveBeenCalledWith({
      spender: '0xMockAddress',
      value: '7b',
    });
  });

  it('should call addTransaction with the correct parameters', async () => {
    await approveTransaction({
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deeplinkManager: mockDeeplinkManager as any,
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ethUrl: mockEthUrl as any,
      origin: mockOrigin,
    });

    expect(spyAddTransaction).toHaveBeenCalledWith(
      {
        to: MOCK_TARGET_ADDRESS,
        from: MOCK_SENDER_ADDRESS,
        value: '0x0',
        data: 'fakeApproveData',
      },
      {
        deviceConfirmedOn: 'metamask_mobile',
        networkClientId: 'mainnet',
        origin: mockOrigin,
      },
    );
  });

  it('should call getAddress with the correct parameters', async () => {
    await approveTransaction({
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deeplinkManager: mockDeeplinkManager as any,
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ethUrl: mockEthUrl as any,
      origin: mockOrigin,
    });

    expect(spyGetAddress).toHaveBeenCalledWith(
      mockEthUrl.parameters?.address as string,
      mockEthUrl.chain_id,
    );
  });

  it('should call showSimpleNotification with the correct parameters if the spender address is invalid', async () => {
    spyGetAddress.mockResolvedValue('');

    await approveTransaction({
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deeplinkManager: mockDeeplinkManager as any,
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ethUrl: mockEthUrl as any,
      origin: mockOrigin,
    });

    expect(spyShowSimpleNotification).toHaveBeenCalledWith({
      status: 'simple_notification_rejected',
      duration: 5000,
      title: 'transaction.invalid_recipient',
      description: 'transaction.invalid_recipient_description',
    });
  });

  it('should call navigate with the correct parameters if the spender address is invalid', async () => {
    spyGetAddress.mockResolvedValue('');

    await approveTransaction({
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deeplinkManager: mockDeeplinkManager as any,
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ethUrl: mockEthUrl as any,
      origin: mockOrigin,
    });

    expect(mockDeeplinkManager.navigation.navigate).toHaveBeenCalledWith(
      'WalletView',
    );
  });

  it('should not call showSimpleNotification if the spender address is valid', async () => {
    spyGetAddress.mockResolvedValue('0xMockAddress');

    await approveTransaction({
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deeplinkManager: mockDeeplinkManager as any,
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ethUrl: mockEthUrl as any,
      origin: mockOrigin,
    });

    expect(spyShowSimpleNotification).not.toHaveBeenCalled();
  });

  it('should not call navigate if the spender address is valid', async () => {
    spyGetAddress.mockResolvedValue('0xMockAddress');

    await approveTransaction({
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deeplinkManager: mockDeeplinkManager as any,
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ethUrl: mockEthUrl as any,
      origin: mockOrigin,
    });

    expect(mockDeeplinkManager.navigation.navigate).not.toHaveBeenCalled();
  });

  it('should throw an error if the uint256 parameter is not a number', async () => {
    const mockEthUrlWithInvalidUint256 = {
      ...mockEthUrl,
      parameters: { uint256: 'invalidUint256', address: '0xMockAddress' },
    };

    await expect(
      approveTransaction({
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deeplinkManager: mockDeeplinkManager as any,
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ethUrl: mockEthUrlWithInvalidUint256 as any,
        origin: mockOrigin,
      }),
    ).rejects.toThrow('The parameter uint256 should be a number');
  });

  it('should throw an error if the uint256 parameter is not an integer', async () => {
    const mockEthUrlWithInvalidUint256 = {
      ...mockEthUrl,
      parameters: { uint256: '1.23', address: '0xMockAddress' },
    };

    await expect(
      approveTransaction({
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deeplinkManager: mockDeeplinkManager as any,
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ethUrl: mockEthUrlWithInvalidUint256 as any,
        origin: mockOrigin,
      }),
    ).rejects.toThrow('The parameter uint256 should be an integer');
  });

  it('does not add a transaction if the spender address is invalid', async () => {
    spyGetAddress.mockResolvedValue('');

    await approveTransaction({
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deeplinkManager: mockDeeplinkManager as any,
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ethUrl: mockEthUrl as any,
      origin: mockOrigin,
    });

    expect(spyGenerateApproveData).not.toHaveBeenCalled();
    expect(spyAddTransaction).not.toHaveBeenCalled();
  });
});
