import React from 'react';
import { Alert } from 'react-native';
import { act, waitFor } from '@testing-library/react-native';
import { ethers } from 'ethers';
import { swapsUtils } from '@metamask/swaps-controller';
import { query } from '@metamask/controller-utils';
import RootRPCMethodsUI from './RootRPCMethodsUI';
import Engine from '../../../core/Engine';
import NotificationManager from '../../../core/NotificationManager';
import TransactionTypes from '../../../core/TransactionTypes';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import {
  MOCK_ACCOUNTS_CONTROLLER_STATE,
  MOCK_ADDRESS_2,
} from '../../../util/test/accountsControllerTestUtils';
import { useMetrics } from '../../hooks/useMetrics';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';
import { MetaMetricsEvents } from '../../../core/Analytics';
import {
  setEtherTransaction,
  setTransactionObject,
} from '../../../actions/transaction';
import { getMethodData } from '../../../util/transactions';
import { isHardwareAccount } from '../../../util/address';
import { getDeviceId } from '../../../core/Ledger/Ledger';
import { updateSwapsTransaction } from '../../../util/swaps/swaps-transactions';
import { KEYSTONE_TX_CANCELED } from '../../../constants/error';
import { STX_NO_HASH_ERROR } from '../../../util/smart-transactions/smart-publish-hook';
import { TransactionModalType } from '../../Approvals/TransactionApproval';

const mockTransactionApproval = jest.fn();

jest.mock('../../../core/Engine', () => ({
  controllerMessenger: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    subscribeOnceIf: jest.fn(),
  },
  acceptPendingApproval: jest.fn(),
  context: {
    KeyringController: { resetQRKeyringState: jest.fn() },
    AssetsContractController: {
      getERC20TokenDecimals: jest.fn(),
      getERC721AssetSymbol: jest.fn(),
    },
    TransactionController: { state: { transactions: [] } },
    SmartTransactionsController: {},
    TokensController: {},
  },
}));

jest.mock('../../../core/WalletConnect/WalletConnect', () => ({
  init: jest.fn(),
  hub: { removeAllListeners: jest.fn() },
}));

jest.mock('../../../core/NotificationManager', () => ({
  watchSubmittedTransaction: jest.fn(),
}));

jest.mock('../../hooks/useMetrics');

jest.mock('../../../actions/transaction', () => ({
  setEtherTransaction: jest.fn(() => ({ type: 'MOCK_SET_ETHER_TRANSACTION' })),
  setTransactionObject: jest.fn(() => ({
    type: 'MOCK_SET_TRANSACTION_OBJECT',
  })),
}));

jest.mock('../../../util/transactions', () => ({
  ...jest.requireActual('../../../util/transactions'),
  getMethodData: jest.fn(),
}));

jest.mock('../../../util/address', () => ({
  ...jest.requireActual('../../../util/address'),
  isHardwareAccount: jest.fn(),
  getAddressAccountType: jest.fn(() => 'MetaMask'),
}));

jest.mock('../../../core/Ledger/Ledger', () => ({
  getDeviceId: jest.fn(),
}));

jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  query: jest.fn(),
}));

jest.mock('../../../util/networks/global-network', () => ({
  getGlobalEthQuery: jest.fn(() => ({})),
}));

jest.mock('../../../util/swaps/swaps-transactions', () => ({
  updateSwapsTransaction: jest.fn(),
}));

jest.mock('../../../util/smart-transactions', () => ({
  ...jest.requireActual('../../../util/smart-transactions'),
  getSmartTransactionMetricsProperties: jest.fn(() => ({})),
}));

jest.mock('../../Approvals/TransactionApproval', () => ({
  TransactionModalType: { Transaction: 'transaction', Dapp: 'dapp' },
  TransactionApproval: (props: { transactionType?: string }) => {
    mockTransactionApproval(props);
    return null;
  },
}));

jest.mock('../../UI/LedgerModals/LedgerTransactionModal', () => ({
  createLedgerTransactionModalNavDetails: (params: unknown) => [
    'LedgerTransactionModal',
    params,
  ],
}));
jest.mock('../../Views/confirmations/components/confirm', () => ({
  ConfirmRoot: () => null,
}));
jest.mock('../../Approvals/SignatureApproval', () => () => null);
jest.mock('../../Approvals/WalletConnectApproval', () => () => null);
jest.mock('../../Approvals/AddChainApproval', () => () => null);
jest.mock('../../Approvals/SwitchChainApproval', () => () => null);
jest.mock('../../Approvals/WatchAssetApproval', () => () => null);
jest.mock('../../Approvals/ConnectApproval', () => () => null);
jest.mock('../../Approvals/PermissionApproval', () => () => null);
jest.mock('../../Approvals/FlowLoaderModal', () => () => null);
jest.mock('../../Approvals/TemplateConfirmationModal', () => () => null);
jest.mock('../../Approvals/InstallSnapApproval', () => () => null);
jest.mock(
  '../../Snaps/SnapDialogApproval/SnapDialogApproval',
  () => () => null,
);
jest.mock('../../Approvals/SnapAccountCustomNameApproval', () => () => null);

const CHAIN_ID = '0x1';
const NETWORK_CLIENT_ID = 'mainnet';
const SELECTED_ADDRESS = MOCK_ADDRESS_2.toLowerCase();
const FOX_CODE = process.env.MM_FOX_CODE as string;
const SWAPS_CONTRACT = swapsUtils.getSwapsContractAddress(CHAIN_ID);
const TX_ID = 'tx-id-1';
const TOKEN_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
const RECIPIENT = '0x0000000000000000000000000000000000000abc';
const DAPP_ORIGIN = 'https://dapp.example';

const hstInterface = new ethers.utils.Interface([
  'function transfer(address to, uint256 value)',
  'function approve(address spender, uint256 value)',
]);
const TRANSFER_DATA = hstInterface.encodeFunctionData('transfer', [
  RECIPIENT,
  '1500000000000000000',
]);
const APPROVE_DATA = hstInterface.encodeFunctionData('approve', [
  RECIPIENT,
  '1000',
]);
const SWAP_APPROVE_DATA = hstInterface.encodeFunctionData('approve', [
  SWAPS_CONTRACT,
  '1000',
]);

const mockTrackEvent = jest.fn();
const mockNavigate = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObject = Record<string, any>;

const mockGetMethodData = getMethodData as unknown as jest.Mock;

const getTransactionArg = (action: unknown): AnyObject =>
  (action as jest.Mock).mock.calls[0][0];

const buildTransactionMeta = (overrides: AnyObject = {}): AnyObject => {
  const { txParams, ...rest } = overrides;
  return {
    id: TX_ID,
    origin: DAPP_ORIGIN,
    chainId: CHAIN_ID,
    networkClientId: NETWORK_CLIENT_ID,
    securityAlertResponse: undefined,
    ...rest,
    txParams: {
      from: SELECTED_ADDRESS,
      to: RECIPIENT,
      value: '0x0',
      gas: '0x5208',
      gasPrice: '0x3b9aca00',
      ...txParams,
    },
  };
};

const buildState = ({
  tokens = [],
  tokenListData = {},
  swapsTransactions = {},
}: {
  tokens?: AnyObject[];
  tokenListData?: AnyObject;
  swapsTransactions?: AnyObject;
} = {}) => ({
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
      TokensController: {
        ...backgroundState.TokensController,
        allTokens: { [CHAIN_ID]: { [SELECTED_ADDRESS]: tokens } },
      },
      TokenListController: {
        ...backgroundState.TokenListController,
        tokensChainsCache: {
          [CHAIN_ID]: { timestamp: 0, data: tokenListData },
        },
      },
      TransactionController: {
        ...backgroundState.TransactionController,
        swapsTransactions,
      },
    },
  },
});

const renderComponent = (stateOptions?: Parameters<typeof buildState>[0]) =>
  renderWithProvider(
    <RootRPCMethodsUI navigation={{ navigate: mockNavigate }} />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { state: buildState(stateOptions) as any },
    false,
  );

const getMessengerMock = (method: 'subscribe' | 'subscribeOnceIf') =>
  jest.mocked(Engine.controllerMessenger[method]) as unknown as jest.Mock;

const getUnapprovedTransactionHandler = () => {
  const calls = getMessengerMock('subscribe').mock.calls.filter(
    ([event]) => event === 'TransactionController:unapprovedTransactionAdded',
  );
  return calls[calls.length - 1][1] as (meta: AnyObject) => Promise<void>;
};

const getSubscribeOnceIfCall = (event: string) =>
  getMessengerMock('subscribeOnceIf').mock.calls.find(([e]) => e === event);

const emitUnapprovedTransaction = async (meta: AnyObject) => {
  await act(async () => {
    await getUnapprovedTransactionHandler()(meta);
  });
};

const lastTransactionType = () =>
  mockTransactionApproval.mock.calls[
    mockTransactionApproval.mock.calls.length - 1
  ][0].transactionType;

describe('RootRPCMethodsUI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useMetrics).mockReturnValue({
      trackEvent: mockTrackEvent,
      createEventBuilder: MetricsEventBuilder.createEventBuilder,
    } as unknown as ReturnType<typeof useMetrics>);
    jest.mocked(isHardwareAccount).mockReturnValue(false);
    mockGetMethodData.mockResolvedValue({});
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    (
      Engine.context.KeyringController.resetQRKeyringState as jest.Mock
    ).mockResolvedValue(undefined);
  });

  it('subscribes to unapprovedTransactionAdded and unsubscribes on unmount', () => {
    const { unmount } = renderComponent();
    const handler = getUnapprovedTransactionHandler();

    unmount();

    expect(Engine.controllerMessenger.unsubscribe).toHaveBeenCalledWith(
      'TransactionController:unapprovedTransactionAdded',
      handler,
    );
  });

  it('ignores transactions originating from MetaMask Mobile', async () => {
    renderComponent();

    await emitUnapprovedTransaction(
      buildTransactionMeta({ origin: TransactionTypes.MMM }),
    );

    expect(Engine.acceptPendingApproval).not.toHaveBeenCalled();
    expect(setEtherTransaction).not.toHaveBeenCalled();
    expect(setTransactionObject).not.toHaveBeenCalled();
    expect(lastTransactionType()).toBeUndefined();
  });

  describe('swap auto-sign', () => {
    it('auto-approves a swap transaction sent to the swaps contract', async () => {
      renderComponent();

      await emitUnapprovedTransaction(
        buildTransactionMeta({
          origin: FOX_CODE,
          txParams: { to: SWAPS_CONTRACT, data: '0x5f575529' },
        }),
      );

      await waitFor(() =>
        expect(Engine.acceptPendingApproval).toHaveBeenCalledWith(TX_ID),
      );
      expect(
        Engine.context.KeyringController.resetQRKeyringState,
      ).toHaveBeenCalled();
      expect(
        getSubscribeOnceIfCall('TransactionController:transactionFinished'),
      ).toBeDefined();
      expect(setEtherTransaction).not.toHaveBeenCalled();
      expect(setTransactionObject).not.toHaveBeenCalled();
    });

    it('auto-approves a swap approval whose spender is the swaps contract', async () => {
      renderComponent();

      await emitUnapprovedTransaction(
        buildTransactionMeta({
          origin: FOX_CODE,
          txParams: { to: TOKEN_ADDRESS, data: SWAP_APPROVE_DATA },
        }),
      );

      await waitFor(() =>
        expect(Engine.acceptPendingApproval).toHaveBeenCalledWith(TX_ID),
      );
    });

    it.each([
      [
        'a dapp origin sending to the swaps contract',
        { origin: DAPP_ORIGIN, to: SWAPS_CONTRACT, data: '0x5f575529' },
      ],
      [
        'the swaps origin approving a non-swaps spender',
        { origin: FOX_CODE, to: TOKEN_ADDRESS, data: APPROVE_DATA },
      ],
      [
        'the swaps origin with no data',
        { origin: FOX_CODE, to: SWAPS_CONTRACT, data: undefined },
      ],
    ])('does not auto-approve %s', async (_, { origin, to, data }) => {
      renderComponent();

      await emitUnapprovedTransaction(
        buildTransactionMeta({ origin, txParams: { to, data } }),
      );

      expect(Engine.acceptPendingApproval).not.toHaveBeenCalled();
      expect(
        getSubscribeOnceIfCall('TransactionController:transactionFinished'),
      ).toBeUndefined();
      expect(setEtherTransaction).toHaveBeenCalledTimes(1);
    });

    it('hands Ledger account swaps over to the Ledger modal instead of accepting', async () => {
      jest.mocked(isHardwareAccount).mockReturnValue(true);
      jest.mocked(getDeviceId).mockResolvedValue('ledger-device-id');
      renderComponent();

      await emitUnapprovedTransaction(
        buildTransactionMeta({
          origin: FOX_CODE,
          txParams: { to: SWAPS_CONTRACT, data: '0x5f575529' },
        }),
      );

      await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
      expect(isHardwareAccount).toHaveBeenCalledWith(SELECTED_ADDRESS, [
        'Ledger Hardware',
      ]);
      expect(mockNavigate).toHaveBeenCalledWith(
        'LedgerTransactionModal',
        expect.objectContaining({
          transactionId: TX_ID,
          deviceId: 'ledger-device-id',
          type: 'signTransaction',
        }),
      );
      expect(Engine.acceptPendingApproval).not.toHaveBeenCalled();
    });

    it('shows an alert when auto-sign fails with a generic error', async () => {
      (
        Engine.context.KeyringController.resetQRKeyringState as jest.Mock
      ).mockRejectedValue(new Error('boom'));
      renderComponent();

      await emitUnapprovedTransaction(
        buildTransactionMeta({
          origin: FOX_CODE,
          txParams: { to: SWAPS_CONTRACT, data: '0x5f575529' },
        }),
      );

      await waitFor(() =>
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.any(String),
          'boom',
          expect.any(Array),
        ),
      );
      expect(Engine.acceptPendingApproval).not.toHaveBeenCalled();
      expect(mockTrackEvent).not.toHaveBeenCalled();
    });

    it('shows an alert when auto-sign fails with an error that has no message', async () => {
      (
        Engine.context.KeyringController.resetQRKeyringState as jest.Mock
      ).mockRejectedValue({});
      renderComponent();

      await emitUnapprovedTransaction(
        buildTransactionMeta({
          origin: FOX_CODE,
          txParams: { to: SWAPS_CONTRACT, data: '0x5f575529' },
        }),
      );

      await waitFor(() => expect(Alert.alert).toHaveBeenCalledTimes(1));
      expect(Engine.acceptPendingApproval).not.toHaveBeenCalled();
    });

    it.each([
      ['KEYSTONE_TX_CANCELED', KEYSTONE_TX_CANCELED],
      ['STX_NO_HASH_ERROR', STX_NO_HASH_ERROR],
    ])(
      'tracks QR hardware cancel instead of alerting for %s',
      async (_, message) => {
        (
          Engine.context.KeyringController.resetQRKeyringState as jest.Mock
        ).mockRejectedValue(new Error(message));
        renderComponent();

        await emitUnapprovedTransaction(
          buildTransactionMeta({
            origin: FOX_CODE,
            txParams: { to: SWAPS_CONTRACT, data: '0x5f575529' },
          }),
        );

        await waitFor(() => expect(mockTrackEvent).toHaveBeenCalledTimes(1));
        expect(mockTrackEvent).toHaveBeenCalledWith(
          MetricsEventBuilder.createEventBuilder(
            MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED,
          ).build(),
        );
        expect(Alert.alert).not.toHaveBeenCalled();
      },
    );

    it('watches the submitted transaction when it finishes successfully', async () => {
      renderComponent();
      await emitUnapprovedTransaction(
        buildTransactionMeta({
          origin: FOX_CODE,
          txParams: { to: SWAPS_CONTRACT, data: '0x5f575529' },
        }),
      );
      await waitFor(() =>
        expect(Engine.acceptPendingApproval).toHaveBeenCalled(),
      );

      const [, handler, criteria] = getSubscribeOnceIfCall(
        'TransactionController:transactionFinished',
      ) as [string, (m: AnyObject) => void, (m: AnyObject) => boolean];

      expect(criteria({ id: TX_ID })).toBe(true);
      expect(criteria({ id: 'other' })).toBe(false);

      const finishedMeta = {
        id: TX_ID,
        status: 'submitted',
        txParams: { assetType: 'ETH' },
      };
      handler(finishedMeta);

      expect(
        NotificationManager.watchSubmittedTransaction,
      ).toHaveBeenCalledWith({ ...finishedMeta, assetType: 'ETH' });
    });

    it('rethrows the error when the transaction finishes unsuccessfully', async () => {
      renderComponent();
      await emitUnapprovedTransaction(
        buildTransactionMeta({
          origin: FOX_CODE,
          txParams: { to: SWAPS_CONTRACT, data: '0x5f575529' },
        }),
      );
      await waitFor(() =>
        expect(Engine.acceptPendingApproval).toHaveBeenCalled(),
      );

      const [, handler] = getSubscribeOnceIfCall(
        'TransactionController:transactionFinished',
      ) as [string, (m: AnyObject) => void];
      const error = new Error('failed');

      expect(() =>
        handler({ id: TX_ID, status: 'failed', error, txParams: {} }),
      ).toThrow(error);
      expect(
        NotificationManager.watchSubmittedTransaction,
      ).not.toHaveBeenCalled();
    });
  });

  describe('ERC-20 transfer decoding', () => {
    const emitTransfer = () =>
      emitUnapprovedTransaction(
        buildTransactionMeta({
          txParams: { to: TOKEN_ADDRESS, value: '0x0', data: TRANSFER_DATA },
        }),
      );

    beforeEach(() => {
      mockGetMethodData.mockResolvedValue({ name: 'transfer' });
    });

    it('uses the asset from the account tokens', async () => {
      const token = { address: TOKEN_ADDRESS, symbol: 'DAI', decimals: 18 };
      renderComponent({ tokens: [token] });

      await emitTransfer();

      expect(getMethodData).toHaveBeenCalledWith(
        TRANSFER_DATA,
        NETWORK_CLIENT_ID,
      );
      expect(setTransactionObject).toHaveBeenCalledTimes(1);
      const transaction = getTransactionArg(setTransactionObject);
      expect(transaction).toEqual(
        expect.objectContaining({
          selectedAsset: token,
          id: TX_ID,
          origin: DAPP_ORIGIN,
          chainId: CHAIN_ID,
          networkClientId: NETWORK_CLIENT_ID,
          from: SELECTED_ADDRESS,
          to: RECIPIENT,
          readableValue: '1.5',
          data: TRANSFER_DATA,
        }),
      );
      expect(transaction.value.toString(10)).toBe('1500000000000000000');
      expect(transaction.gas.toString(10)).toBe('21000');
      expect(setEtherTransaction).not.toHaveBeenCalled();
      expect(lastTransactionType()).toBe(TransactionModalType.Dapp);
    });

    it('falls back to the token list when the token is not in account tokens', async () => {
      const listToken = { address: TOKEN_ADDRESS, symbol: 'DAI', decimals: 6 };
      renderComponent({ tokenListData: { [TOKEN_ADDRESS]: listToken } });

      await emitTransfer();

      const transaction = getTransactionArg(setTransactionObject);
      expect(transaction.selectedAsset).toEqual(listToken);
      expect(transaction.readableValue).toBe('1500000000000');
      expect(transaction.to).toBe(RECIPIENT);
      expect(
        Engine.context.AssetsContractController.getERC20TokenDecimals,
      ).not.toHaveBeenCalled();
    });

    it('looks up the token contract when it is unknown', async () => {
      (
        Engine.context.AssetsContractController
          .getERC20TokenDecimals as jest.Mock
      ).mockResolvedValue(18);
      (
        Engine.context.AssetsContractController
          .getERC721AssetSymbol as jest.Mock
      ).mockResolvedValue('TKN');
      renderComponent();

      await emitTransfer();

      expect(
        Engine.context.AssetsContractController.getERC20TokenDecimals,
      ).toHaveBeenCalledWith(TOKEN_ADDRESS);
      const transaction = getTransactionArg(setTransactionObject);
      expect(transaction.selectedAsset).toEqual({
        decimals: 18,
        symbol: 'TKN',
        address: TOKEN_ADDRESS,
      });
      expect(transaction.readableValue).toBe('1.5');
      expect(transaction.to).toBe(RECIPIENT);
    });

    it('falls back to an ERC20 asset with 0 decimals when the contract lookup fails', async () => {
      (
        Engine.context.AssetsContractController
          .getERC20TokenDecimals as jest.Mock
      ).mockRejectedValue(new Error('wrong network'));
      renderComponent();

      await emitTransfer();

      const transaction = getTransactionArg(setTransactionObject);
      expect(transaction.selectedAsset.symbol).toBe('ERC20');
      expect(transaction.selectedAsset.address).toBe(TOKEN_ADDRESS);
      expect(transaction.selectedAsset.decimals.toString()).toBe('0');
      expect(transaction.readableValue).toBe('1500000000000000000');
      expect(transaction.to).toBe(RECIPIENT);
    });

    it('treats non-transfer contract calls as native transactions', async () => {
      mockGetMethodData.mockResolvedValue({ name: 'mint' });
      renderComponent();

      await emitTransfer();

      expect(setTransactionObject).not.toHaveBeenCalled();
      expect(setEtherTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ to: TOKEN_ADDRESS, readableValue: '0' }),
      );
    });
  });

  describe('native transactions', () => {
    it('converts the value from wei and sets the ether transaction', async () => {
      renderComponent();

      await emitUnapprovedTransaction(
        buildTransactionMeta({
          securityAlertResponse: { result_type: 'Benign' },
          txParams: { value: '0xde0b6b3a7640000' },
        }),
      );

      expect(getMethodData).not.toHaveBeenCalled();
      expect(setEtherTransaction).toHaveBeenCalledTimes(1);
      const transaction = getTransactionArg(setEtherTransaction);
      expect(transaction).toEqual(
        expect.objectContaining({
          id: TX_ID,
          origin: DAPP_ORIGIN,
          chainId: CHAIN_ID,
          networkClientId: NETWORK_CLIENT_ID,
          securityAlertResponse: { result_type: 'Benign' },
          to: RECIPIENT,
          readableValue: '1',
        }),
      );
      expect(transaction.value.toString(10)).toBe('1000000000000000000');
      expect(transaction.gasPrice.toString(10)).toBe('1000000000');
      expect(lastTransactionType()).toBe(TransactionModalType.Dapp);
    });

    it('does not mutate the transaction meta received from the controller', async () => {
      renderComponent();
      const meta = buildTransactionMeta({ txParams: { value: '0x1' } });

      await emitUnapprovedTransaction(meta);

      expect(meta.txParams.value).toBe('0x1');
      expect(meta.txParams.gas).toBe('0x5208');
      expect(meta.txParams.readableValue).toBeUndefined();
    });
  });

  describe('modal type', () => {
    it('uses the Transaction modal for zero-value approvals', async () => {
      renderComponent();

      await emitUnapprovedTransaction(
        buildTransactionMeta({
          txParams: { to: TOKEN_ADDRESS, value: '0x0', data: APPROVE_DATA },
        }),
      );

      expect(lastTransactionType()).toBe(TransactionModalType.Transaction);
    });

    it('uses the Dapp modal for approvals that carry value', async () => {
      renderComponent();

      await emitUnapprovedTransaction(
        buildTransactionMeta({
          txParams: { to: TOKEN_ADDRESS, value: '0x1', data: APPROVE_DATA },
        }),
      );

      expect(lastTransactionType()).toBe(TransactionModalType.Dapp);
    });
  });

  describe('trackSwaps', () => {
    const SWAP_TX_ID = 'swap-tx-id';
    const APPROVAL_TX_ID = 'approval-tx-id';
    const swapAnalytics = {
      available_quotes: 5,
      best_quote_source: 'oneInchV5',
      chain_id: '1',
      custom_slippage: false,
      network_fees_ETH: '0.00337',
      network_fees_USD: '$12.04',
      other_quote_selected: false,
      request_type: 'Order',
      token_from: 'ETH',
      token_from_amount: '0.001254',
      token_to: 'USDC',
      token_to_amount: '4.440771',
      isGasIncludedTrade: false,
    };
    const swapsTransactions = {
      [SWAP_TX_ID]: {
        action: 'swap',
        analytics: swapAnalytics,
        destinationAmount: '4000000',
        destinationToken: {
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          decimals: 6,
        },
        paramsForAnalytics: {
          approvalTransactionMetaId: APPROVAL_TX_ID,
          ethAccountBalance: '0xedfffbea734a07',
          gasEstimate: 200000,
          sentAt: 1000,
        },
      },
    };
    const swapMeta = buildTransactionMeta({
      id: SWAP_TX_ID,
      origin: FOX_CODE,
      hash: '0xswaphash',
      txParams: { to: SWAPS_CONTRACT, data: '0x5f575529' },
    });

    const receipt = { gasUsed: 150000, blockHash: '0xblock' };
    const approvalReceipt = { gasUsed: 46000 };

    const mockQueries = () => {
      jest.mocked(query).mockImplementation(async (_ethQuery, method, args) => {
        if (method === 'getBalance') return '0x1';
        if (method === 'getBlockByHash') return { timestamp: 1060 };
        if (method === 'getTransactionReceipt') {
          return args?.[0] === '0xapprovalhash' ? approvalReceipt : receipt;
        }
        throw new Error(`unexpected ${method}`);
      });
    };

    const triggerSwapCompleted = async () => {
      renderComponent({ swapsTransactions });
      await emitUnapprovedTransaction(swapMeta);
      await waitFor(() =>
        expect(
          getSubscribeOnceIfCall('TransactionController:transactionConfirmed'),
        ).toBeDefined(),
      );
      const [, handler] = getSubscribeOnceIfCall(
        'TransactionController:transactionConfirmed',
      ) as [string, (m: AnyObject) => void];
      await act(async () => {
        handler(swapMeta);
      });
    };

    beforeEach(() => {
      (Engine.context.TransactionController.state as AnyObject).transactions = [
        {
          id: APPROVAL_TX_ID,
          hash: '0xapprovalhash',
          txParams: { from: SELECTED_ADDRESS },
        },
      ];
    });

    it('tracks SWAP_COMPLETED with computed gas and quote ratios', async () => {
      mockQueries();
      const getSwapsTokensReceivedSpy = jest
        .spyOn(swapsUtils, 'getSwapsTokensReceived')
        .mockReturnValue('0x3d0900');

      await triggerSwapCompleted();

      await waitFor(() => expect(mockTrackEvent).toHaveBeenCalledTimes(1));

      expect(query).toHaveBeenCalledWith(expect.anything(), 'getBalance', [
        MOCK_ADDRESS_2,
      ]);
      expect(query).toHaveBeenCalledWith(
        expect.anything(),
        'getTransactionReceipt',
        ['0xapprovalhash'],
      );
      expect(getSwapsTokensReceivedSpy).toHaveBeenCalledWith(
        receipt,
        approvalReceipt,
        expect.objectContaining({ to: SWAPS_CONTRACT }),
        { from: SELECTED_ADDRESS },
        swapsTransactions[SWAP_TX_ID].destinationToken,
        '0xedfffbea734a07',
        '0x1',
      );

      expect(mockTrackEvent).toHaveBeenCalledWith(
        MetricsEventBuilder.createEventBuilder(MetaMetricsEvents.SWAP_COMPLETED)
          .addProperties({
            time_to_mine: 60,
            estimated_vs_used_gasRatio: '75.00%',
            quote_vs_executionRatio: '100.00%',
            token_to_amount_received: '4',
            is_smart_transaction: false,
            gas_included: false,
            available_quotes: 5,
            best_quote_source: 'oneInchV5',
            chain_id: '1',
            custom_slippage: false,
            network_fees_USD: '$12.04',
            other_quote_selected: false,
            request_type: 'Order',
            token_from: 'ETH',
            token_to: 'USDC',
          })
          .addSensitiveProperties({
            token_from_amount: '0.001254',
            token_to_amount: '4.440771',
            network_fees_ETH: '0.00337',
          })
          .build(),
      );

      expect(updateSwapsTransaction).toHaveBeenCalledWith(
        SWAP_TX_ID,
        expect.any(Function),
      );
      const mutate = jest.mocked(updateSwapsTransaction).mock.calls[0][1];
      const swapsTransaction: AnyObject = {
        analytics: {},
        paramsForAnalytics: {},
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mutate(swapsTransaction as any);
      expect(swapsTransaction).toEqual({
        gasUsed: 150000,
        receivedDestinationAmount: '4000000',
      });

      getSwapsTokensReceivedSpy.mockRestore();
    });

    it('tracks SWAP_TRACKING_FAILED when an RPC query fails', async () => {
      const error = new Error('rpc down');
      jest.mocked(query).mockRejectedValue(error);

      await triggerSwapCompleted();

      await waitFor(() => expect(mockTrackEvent).toHaveBeenCalledTimes(1));
      expect(mockTrackEvent).toHaveBeenCalledWith(
        MetricsEventBuilder.createEventBuilder(
          MetaMetricsEvents.SWAP_TRACKING_FAILED,
        )
          .addProperties({ error } as never)
          .build(),
      );
      expect(updateSwapsTransaction).not.toHaveBeenCalled();
    });

    it('tracks SWAP_FAILED when the swap transaction finishes unsuccessfully', async () => {
      mockQueries();
      jest
        .spyOn(swapsUtils, 'getSwapsTokensReceived')
        .mockReturnValue(undefined as unknown as string);
      renderComponent({ swapsTransactions });
      await emitUnapprovedTransaction(swapMeta);
      await waitFor(() =>
        expect(Engine.acceptPendingApproval).toHaveBeenCalled(),
      );

      const [, handler] = getSubscribeOnceIfCall(
        'TransactionController:transactionFinished',
      ) as [string, (m: AnyObject) => void];

      expect(() =>
        handler({ ...swapMeta, status: 'failed', error: new Error('x') }),
      ).toThrow('x');

      await waitFor(() => expect(mockTrackEvent).toHaveBeenCalledTimes(1));
      const event = mockTrackEvent.mock.calls[0][0];
      expect(event.name).toBe(MetaMetricsEvents.SWAP_FAILED.category);
      expect(event.properties.quote_vs_executionRatio).toBe('0.00%');
    });
  });
});
