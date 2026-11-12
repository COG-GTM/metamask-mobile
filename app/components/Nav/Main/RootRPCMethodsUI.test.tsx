import React from 'react';
import { act } from '@testing-library/react-native';
import RootRPCMethodsUI from './RootRPCMethodsUI';
import Engine from '../../../core/Engine';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { createSwapsActionId } from '../../../util/swaps/swaps-transaction-registry';

type UnapprovedTransactionHandler = (
  transactionMeta: Record<string, unknown>,
) => Promise<void>;

let onUnapprovedTransaction: UnapprovedTransactionHandler | undefined;

jest.mock('../../../core/Engine', () => ({
  acceptPendingApproval: jest.fn(),
  controllerMessenger: {
    subscribe: jest.fn(
      (event: string, handler: UnapprovedTransactionHandler) => {
        if (event === 'TransactionController:unapprovedTransactionAdded') {
          onUnapprovedTransaction = handler;
        }
      },
    ),
    unsubscribe: jest.fn(),
    subscribeOnceIf: jest.fn(),
  },
  context: {
    KeyringController: {
      resetQRKeyringState: jest.fn(),
    },
    AssetsContractController: {},
  },
}));

jest.mock('../../../core/WalletConnect/WalletConnect', () => ({
  init: jest.fn(),
  hub: { removeAllListeners: jest.fn() },
}));

jest.mock('../../../util/address', () => ({
  ...jest.requireActual('../../../util/address'),
  isHardwareAccount: jest.fn(() => false),
}));

jest.mock('../../../util/transactions', () => ({
  ...jest.requireActual('../../../util/transactions'),
  getMethodData: jest.fn(async () => ({ name: 'approve' })),
}));

jest.mock('../../Approvals/WatchAssetApproval', () => () => null);
jest.mock('../../Approvals/SignatureApproval', () => () => null);
jest.mock('../../Approvals/AddChainApproval', () => () => null);
jest.mock('../../Approvals/SwitchChainApproval', () => () => null);
jest.mock('../../Approvals/WalletConnectApproval', () => () => null);
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
jest.mock('../../UI/LedgerModals/LedgerTransactionModal', () => ({
  createLedgerTransactionModalNavDetails: jest.fn(),
}));
jest.mock('../../Approvals/TransactionApproval', () => ({
  TransactionApproval: () => null,
  TransactionModalType: { Transaction: 'transaction', Dapp: 'dapp' },
}));
jest.mock('../../../components/Views/confirmations/components/confirm', () => ({
  ConfirmRoot: () => null,
}));

const SWAPS_CONTRACT = '0x881d40237659c251811cec9c364ef91dc08d300c';
const ATTACKER_CONTRACT = '0x1111111111111111111111111111111111111111';
const APPROVE_SWAPS_DATA = `0x095ea7b3000000000000000000000000${SWAPS_CONTRACT.slice(
  2,
)}00000000000000000000000000000000000000000000000000000000000f4240`;

const buildTransactionMeta = (overrides: Record<string, unknown> = {}) => ({
  id: 'tx-id',
  chainId: '0x1',
  networkClientId: 'mainnet',
  origin: process.env.MM_FOX_CODE,
  txParams: {
    from: '0x0000000000000000000000000000000000000001',
    to: ATTACKER_CONTRACT,
    data: APPROVE_SWAPS_DATA,
    value: '0xde0b6b3a7640000',
    gas: '0x5208',
  },
  ...overrides,
});

const renderComponent = () =>
  renderWithProvider(
    <RootRPCMethodsUI navigation={{ navigate: jest.fn() }} />,
    {
      state: {
        engine: {
          backgroundState: {
            ...backgroundState,
            NetworkController: {
              ...backgroundState.NetworkController,
              selectedNetworkClientId: 'mainnet',
            },
          },
        },
      },
    },
  );

describe('RootRPCMethodsUI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    onUnapprovedTransaction = undefined;
  });

  it('shows a confirmation instead of auto signing a transaction that only spoofs the swaps origin', async () => {
    const { store } = renderComponent();

    await act(async () => {
      await onUnapprovedTransaction?.(buildTransactionMeta());
    });

    expect(onUnapprovedTransaction).toBeDefined();
    expect(Engine.acceptPendingApproval).not.toHaveBeenCalled();
    expect(store.getState().transaction).toMatchObject({
      id: 'tx-id',
      origin: process.env.MM_FOX_CODE,
      transaction: { to: ATTACKER_CONTRACT },
    });
  });

  it('auto signs a swaps transaction registered by the swaps flow', async () => {
    const { store } = renderComponent();
    const actionId = createSwapsActionId();

    await act(async () => {
      await onUnapprovedTransaction?.(
        buildTransactionMeta({
          actionId,
          txParams: {
            from: '0x0000000000000000000000000000000000000001',
            to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            data: APPROVE_SWAPS_DATA,
            value: '0x0',
            gas: '0x5208',
          },
        }),
      );
    });

    expect(Engine.acceptPendingApproval).toHaveBeenCalledWith('tx-id');
    expect(store.getState().transaction.id).toBeUndefined();
  });
});
