import React from 'react';
import { waitFor } from '@testing-library/react-native';
import Engine from '../../../core/Engine';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { createSwapsActionId } from '../../../util/transactions/internal-origins';
import RootRPCMethodsUI from './RootRPCMethodsUI';

const mockSubscribe = jest.fn();

jest.mock('../../../core/Engine', () => ({
  acceptPendingApproval: jest.fn(),
  controllerMessenger: {
    subscribe: (...args: unknown[]) => mockSubscribe(...args),
    unsubscribe: jest.fn(),
    subscribeOnceIf: jest.fn(),
  },
  context: {
    KeyringController: { resetQRKeyringState: jest.fn() },
    TransactionController: { state: { transactions: [] } },
    AssetsContractController: {},
    TokensController: {},
  },
}));
jest.mock('../../../core/WalletConnect/WalletConnect', () => ({
  init: jest.fn(),
  hub: { removeAllListeners: jest.fn() },
}));
jest.mock('../../../util/address', () => ({
  ...jest.requireActual('../../../util/address'),
  isHardwareAccount: jest.fn().mockReturnValue(false),
}));
jest.mock('../../../util/transactions', () => ({
  ...jest.requireActual('../../../util/transactions'),
  getMethodData: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../Approvals/WatchAssetApproval', () => () => null);
jest.mock('../../Approvals/SignatureApproval', () => () => null);
jest.mock('../../Approvals/AddChainApproval', () => () => null);
jest.mock('../../Approvals/SwitchChainApproval', () => () => null);
jest.mock('../../Approvals/WalletConnectApproval', () => () => null);
jest.mock('../../Approvals/ConnectApproval', () => () => null);
jest.mock('../../Approvals/TransactionApproval', () => ({
  TransactionApproval: () => null,
  TransactionModalType: { Transaction: 'transaction', Dapp: 'dapp' },
}));
jest.mock('../../Approvals/PermissionApproval', () => () => null);
jest.mock('../../Approvals/FlowLoaderModal', () => () => null);
jest.mock('../../Approvals/TemplateConfirmationModal', () => () => null);
jest.mock('../../Approvals/InstallSnapApproval', () => () => null);
jest.mock('../../Snaps/SnapDialogApproval/SnapDialogApproval', () => () => null);
jest.mock('../../Approvals/SnapAccountCustomNameApproval', () => () => null);
jest.mock('../../../components/Views/confirmations/components/confirm', () => ({
  ConfirmRoot: () => null,
}));

const SWAPS_CONTRACT = '0x881d40237659c251811cec9c364ef91dc08d300c';
const APPROVE_SWAPS_CONTRACT_DATA = `0x095ea7b3000000000000000000000000${SWAPS_CONTRACT.slice(
  2,
)}000000000000000000000000000000000000000000000000000000001cd7f673`;
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const ATTACKER_CONTRACT = '0x000000000000000000000000000000000000dead';
const FROM = '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452';

const getUnapprovedTransactionHandler = async () => {
  renderWithProvider(<RootRPCMethodsUI navigation={{ navigate: jest.fn() }} />, {
    state: { engine: { backgroundState } },
  });
  await waitFor(() =>
    expect(mockSubscribe).toHaveBeenCalledWith(
      'TransactionController:unapprovedTransactionAdded',
      expect.any(Function),
    ),
  );
  const call = mockSubscribe.mock.calls
    .filter(
      ([event]) => event === 'TransactionController:unapprovedTransactionAdded',
    )
    .pop();
  return call[1];
};

const buildTransactionMeta = (overrides: Record<string, unknown> = {}) => ({
  id: 'tx-1',
  chainId: '0x1',
  networkClientId: 'mainnet',
  origin: process.env.MM_FOX_CODE,
  txParams: {
    from: FROM,
    to: USDC,
    value: '0x0',
    data: APPROVE_SWAPS_CONTRACT_DATA,
    gas: '0x5208',
  },
  ...overrides,
});

describe('RootRPCMethodsUI Swaps auto-sign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not auto-sign a dapp transaction that spoofs the Swaps origin', async () => {
    const onUnapprovedTransaction = await getUnapprovedTransactionHandler();

    await onUnapprovedTransaction(
      buildTransactionMeta({
        txParams: {
          from: FROM,
          to: ATTACKER_CONTRACT,
          value: '0xde0b6b3a7640000',
          data: APPROVE_SWAPS_CONTRACT_DATA,
          gas: '0x5208',
        },
      }),
    );

    expect(Engine.acceptPendingApproval).not.toHaveBeenCalled();
  });

  it('does not auto-sign a Swaps-origin transaction with a forged action ID', async () => {
    const onUnapprovedTransaction = await getUnapprovedTransactionHandler();

    await onUnapprovedTransaction(
      buildTransactionMeta({ actionId: 'mm-swaps-forged' }),
    );

    expect(Engine.acceptPendingApproval).not.toHaveBeenCalled();
  });

  it('does not auto-sign a Swaps-flow approve that also sends native value', async () => {
    const onUnapprovedTransaction = await getUnapprovedTransactionHandler();

    await onUnapprovedTransaction(
      buildTransactionMeta({
        actionId: createSwapsActionId(),
        txParams: {
          from: FROM,
          to: ATTACKER_CONTRACT,
          value: '0xde0b6b3a7640000',
          data: APPROVE_SWAPS_CONTRACT_DATA,
          gas: '0x5208',
        },
      }),
    );

    expect(Engine.acceptPendingApproval).not.toHaveBeenCalled();
  });

  it('auto-signs an approve created by the Swaps screen', async () => {
    const onUnapprovedTransaction = await getUnapprovedTransactionHandler();

    await onUnapprovedTransaction(
      buildTransactionMeta({ actionId: createSwapsActionId() }),
    );

    await waitFor(() =>
      expect(Engine.acceptPendingApproval).toHaveBeenCalledWith('tx-1'),
    );
  });
});
