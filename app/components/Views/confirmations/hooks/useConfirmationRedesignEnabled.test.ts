import { ApprovalType } from '@metamask/controller-utils';
import { TransactionType } from '@metamask/transaction-controller';
import { merge, cloneDeep } from 'lodash';

// eslint-disable-next-line import/no-namespace
import { isHardwareAccount } from '../../../../util/address';
import { renderHookWithProvider } from '../../../../util/test/renderWithProvider';
import {
  generateContractInteractionState,
  personalSignatureConfirmationState,
  stakingDepositConfirmationState,
  transferConfirmationState,
} from '../../../../util/test/confirm-data-helpers';
import { useConfirmationRedesignEnabled } from './useConfirmationRedesignEnabled';
import { selectConfirmationRedesignFlags } from '../../../../selectors/featureFlagController/confirmations';

const disabledFeatureFlags = {
  signatures: false,
  staking_confirmations: false,
  contract_interaction: false,
  transfer: false,
};

const enabledFeatureFlags = {
  signatures: true,
  staking_confirmations: true,
  contract_interaction: true,
  transfer: true,
};

function withTransactionType<
  T extends {
    engine: {
      backgroundState: {
        TransactionController: { transactions: { type?: TransactionType }[] };
      };
    };
  },
>(state: T, type: TransactionType): T {
  const clonedState = cloneDeep(state);
  clonedState.engine.backgroundState.TransactionController.transactions[0].type =
    type;
  return clonedState;
}

jest.mock('../../../../util/address', () => ({
  ...jest.requireActual('../../../../util/address'),
  isHardwareAccount: jest.fn(),
  isExternalHardwareAccount: jest.fn(),
}));

jest.mock('../../../../core/Engine', () => ({
  getTotalEvmFiatAccountBalance: () => ({ tokenFiat: 10 }),
  context: {
    KeyringController: {
      state: {
        keyrings: [],
      },
      getOrAddQRKeyring: jest.fn(),
    },
    TokenListController: {
      fetchTokenList: jest.fn(),
    },
  },
  controllerMessenger: {
    subscribe: jest.fn(),
  },
}));

jest.mock('../../../../selectors/featureFlagController/confirmations');

describe('useConfirmationRedesignEnabled', () => {
  const confirmationRedesignFlagsMock = jest.mocked(
    selectConfirmationRedesignFlags,
  );

  describe('signature confirmations', () => {
    it('returns true for personal sign request', async () => {
      confirmationRedesignFlagsMock.mockReturnValue({
        ...disabledFeatureFlags,
        signatures: true,
      });

      const { result } = renderHookWithProvider(
        useConfirmationRedesignEnabled,
        {
          state: personalSignatureConfirmationState,
        },
      );

      expect(result.current.isRedesignedEnabled).toBe(true);
    });

    it('returns false when remote flag is disabled', async () => {
      confirmationRedesignFlagsMock.mockReturnValue(disabledFeatureFlags);

      const { result } = renderHookWithProvider(
        useConfirmationRedesignEnabled,
        {
          state: personalSignatureConfirmationState,
        },
      );

      expect(result.current.isRedesignedEnabled).toBe(false);
    });
  });

  describe('transaction redesigned confirmations', () => {
    describe('staking confirmations', () => {
      describe('staking deposit', () => {
        beforeEach(() => {
          jest.clearAllMocks();
          (isHardwareAccount as jest.Mock).mockReturnValue(false);
        });

        it('returns true when enabled', async () => {
          confirmationRedesignFlagsMock.mockReturnValue({
            ...disabledFeatureFlags,
            staking_confirmations: true,
          });

          const { result } = renderHookWithProvider(
            useConfirmationRedesignEnabled,
            {
              state: stakingDepositConfirmationState,
            },
          );

          expect(result.current.isRedesignedEnabled).toBe(true);
        });

        it('returns false when remote flag is disabled', async () => {
          confirmationRedesignFlagsMock.mockReturnValue({
            ...disabledFeatureFlags,
            signatures: true,
          });

          const { result } = renderHookWithProvider(
            useConfirmationRedesignEnabled,
            {
              state: stakingDepositConfirmationState,
            },
          );

          expect(result.current.isRedesignedEnabled).toBe(false);
        });

        it('returns false when transactionMeta is not present', async () => {
          confirmationRedesignFlagsMock.mockReturnValue({
            ...disabledFeatureFlags,
            signatures: true,
            staking_confirmations: true,
          });

          const withoutTransactions = cloneDeep(
            stakingDepositConfirmationState,
          );
          withoutTransactions.engine.backgroundState.TransactionController.transactions =
            [];

          const { result } = renderHookWithProvider(
            useConfirmationRedesignEnabled,
            {
              state: withoutTransactions,
            },
          );

          expect(result.current.isRedesignedEnabled).toBe(false);
        });

        it('returns false when approval type is not transaction', async () => {
          confirmationRedesignFlagsMock.mockReturnValue({
            ...disabledFeatureFlags,
            signatures: true,
            staking_confirmations: true,
          });

          const approvalId =
            stakingDepositConfirmationState.engine.backgroundState
              .TransactionController.transactions[0].id;

          const state = merge(stakingDepositConfirmationState, {
            engine: {
              backgroundState: {
                ApprovalController: {
                  pendingApprovals: {
                    [approvalId]: {
                      type: 'not_transaction' as ApprovalType,
                    },
                  },
                },
              },
            },
          });

          const { result } = renderHookWithProvider(
            useConfirmationRedesignEnabled,
            {
              state,
            },
          );

          expect(result.current.isRedesignedEnabled).toBe(false);
        });

        it('returns false when from address is external hardware account', async () => {
          confirmationRedesignFlagsMock.mockReturnValue({
            ...disabledFeatureFlags,
            signatures: true,
            staking_confirmations: true,
          });

          (isHardwareAccount as jest.Mock).mockReturnValue(true);
          const { result } = renderHookWithProvider(
            useConfirmationRedesignEnabled,
            {
              state: stakingDepositConfirmationState,
            },
          );

          expect(result.current.isRedesignedEnabled).toBe(false);
        });

        it('only redesign if transactions is staking deposit', async () => {
          confirmationRedesignFlagsMock.mockReturnValue({
            ...disabledFeatureFlags,
            signatures: true,
            staking_confirmations: true,
          });

          const withBridgeTransaction = cloneDeep(
            stakingDepositConfirmationState,
          );
          withBridgeTransaction.engine.backgroundState.TransactionController.transactions[0].type =
            TransactionType.bridge;

          const { result } = renderHookWithProvider(
            useConfirmationRedesignEnabled,
            {
              state: withBridgeTransaction,
            },
          );

          expect(result.current.isRedesignedEnabled).toBe(false);
        });
      });
    });

    describe('contract interaction confirmations', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        (isHardwareAccount as jest.Mock).mockReturnValue(false);
      });

      it('returns true when contract_interaction flag is enabled', async () => {
        confirmationRedesignFlagsMock.mockReturnValue({
          ...disabledFeatureFlags,
          contract_interaction: true,
        });

        const { result } = renderHookWithProvider(
          useConfirmationRedesignEnabled,
          {
            state: generateContractInteractionState,
          },
        );

        expect(result.current.isRedesignedEnabled).toBe(true);
      });

      it('returns false when contract_interaction flag is disabled', async () => {
        confirmationRedesignFlagsMock.mockReturnValue({
          ...enabledFeatureFlags,
          contract_interaction: false,
        });

        const { result } = renderHookWithProvider(
          useConfirmationRedesignEnabled,
          {
            state: generateContractInteractionState,
          },
        );

        expect(result.current.isRedesignedEnabled).toBe(false);
      });

      it('returns false when from address is hardware account', async () => {
        confirmationRedesignFlagsMock.mockReturnValue(enabledFeatureFlags);
        (isHardwareAccount as jest.Mock).mockReturnValue(true);

        const { result } = renderHookWithProvider(
          useConfirmationRedesignEnabled,
          {
            state: generateContractInteractionState,
          },
        );

        expect(result.current.isRedesignedEnabled).toBe(false);
      });
    });

    describe('unsupported transaction types', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        (isHardwareAccount as jest.Mock).mockReturnValue(false);
      });

      it.each([
        TransactionType.swap,
        TransactionType.bridge,
        TransactionType.tokenMethodApprove,
      ])(
        'returns false for %s even when all flags are enabled',
        async (type) => {
          confirmationRedesignFlagsMock.mockReturnValue(enabledFeatureFlags);

          const { result } = renderHookWithProvider(
            useConfirmationRedesignEnabled,
            {
              state: withTransactionType(
                generateContractInteractionState,
                type,
              ),
            },
          );

          expect(result.current.isRedesignedEnabled).toBe(false);
        },
      );
    });

    describe('transfer confirmations', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        (isHardwareAccount as jest.Mock).mockReturnValue(false);
      });

      it.each([
        TransactionType.simpleSend,
        TransactionType.tokenMethodTransfer,
        TransactionType.tokenMethodTransferFrom,
      ])('returns true for %s when transfer flag is enabled', async (type) => {
        confirmationRedesignFlagsMock.mockReturnValue({
          ...disabledFeatureFlags,
          transfer: true,
        });

        const { result } = renderHookWithProvider(
          useConfirmationRedesignEnabled,
          {
            state: withTransactionType(transferConfirmationState, type),
          },
        );

        expect(result.current.isRedesignedEnabled).toBe(true);
      });

      it.each([
        TransactionType.simpleSend,
        TransactionType.tokenMethodTransfer,
        TransactionType.tokenMethodTransferFrom,
      ])(
        'returns false for %s when transfer flag is disabled',
        async (type) => {
          confirmationRedesignFlagsMock.mockReturnValue({
            ...enabledFeatureFlags,
            transfer: false,
          });

          const { result } = renderHookWithProvider(
            useConfirmationRedesignEnabled,
            {
              state: withTransactionType(transferConfirmationState, type),
            },
          );

          expect(result.current.isRedesignedEnabled).toBe(false);
        },
      );

      it('returns false when from address is hardware account', async () => {
        confirmationRedesignFlagsMock.mockReturnValue(enabledFeatureFlags);
        (isHardwareAccount as jest.Mock).mockReturnValue(true);

        const { result } = renderHookWithProvider(
          useConfirmationRedesignEnabled,
          {
            state: transferConfirmationState,
          },
        );

        expect(result.current.isRedesignedEnabled).toBe(false);
      });

      it('returns true when flag is enabled', async () => {
        confirmationRedesignFlagsMock.mockReturnValue({
          ...disabledFeatureFlags,
          transfer: true,
        });

        const { result } = renderHookWithProvider(
          useConfirmationRedesignEnabled,
          {
            state: transferConfirmationState,
          },
        );

        expect(result.current.isRedesignedEnabled).toBe(true);
      });

      it('returns false when approval type is not transaction', async () => {
        confirmationRedesignFlagsMock.mockReturnValue(disabledFeatureFlags);

        const { result } = renderHookWithProvider(
          useConfirmationRedesignEnabled,
          {
            state: personalSignatureConfirmationState,
          },
        );

        expect(result.current.isRedesignedEnabled).toBe(false);
      });
    });
  });
});
