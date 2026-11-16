import cloneDeep from 'lodash/cloneDeep';
import {
  TransactionEnvelopeType,
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';

import { renderHookWithProvider } from '../../../../../util/test/renderWithProvider';
import { stakingDepositConfirmationState } from '../../../../../util/test/confirm-data-helpers';
import Engine from '../../../../../core/Engine';
import { useFeeCalculations } from './useFeeCalculations';

jest.mock('../../../../../core/Engine', () => ({
  context: {
    GasFeeController: {
      startPolling: jest.fn(),
      stopPollingByPollingToken: jest.fn(),
    },
    NetworkController: {
      getNetworkConfigurationByNetworkClientId: jest.fn(),
    },
  },
}));

describe('useFeeCalculations', () => {
  const transactionMeta =
    stakingDepositConfirmationState.engine.backgroundState.TransactionController
      .transactions[0];

  const mockGetNetworkConfigurationByNetworkClientId = jest.mocked(
    Engine.context.NetworkController.getNetworkConfigurationByNetworkClientId,
  );

  // Fixture values: gasLimitNoBuffer 0x11929 (71977), maxFeePerGas 0x84594b20
  // (2220444448 wei), maxPriorityFeePerGas 0x4dcd6500 (1305306368 wei).
  const LEGACY_GAS_PRICE = '0x12a05f200'; // 5 gwei
  // 5000000000 * 71977
  const LEGACY_EXPECTED_FEE_HEX = '0x147504195c200';

  const renderWithState = (state: typeof stakingDepositConfirmationState) => {
    const txMeta = state.engine.backgroundState.TransactionController
      .transactions[0] as TransactionMeta;
    return renderHookWithProvider(() => useFeeCalculations(txMeta), {
      state,
    });
  };

  afterEach(() => {
    mockGetNetworkConfigurationByNetworkClientId.mockReset();
  });

  it('returns no estimates for empty txParams', async () => {
    const clonedStateWithoutTxParams = cloneDeep(
      stakingDepositConfirmationState,
    );
    clonedStateWithoutTxParams.engine.backgroundState.TransactionController.transactions[0].txParams =
      undefined as unknown as TransactionParams;

    const transactionMetaWithoutTxParams =
      clonedStateWithoutTxParams.engine.backgroundState.TransactionController
        .transactions[0];

    const { result } = renderHookWithProvider(
      () => useFeeCalculations(transactionMetaWithoutTxParams),
      {
        state: clonedStateWithoutTxParams,
      },
    );
    expect(result.current).toMatchInlineSnapshot(`
            {
              "estimatedFeeFiat": "$0.00",
              "estimatedFeeNative": "0 ETH",
              "preciseNativeFeeInHex": "0x0",
            }
          `);
  });

  it('returns fee calculations', async () => {
    const { result } = renderHookWithProvider(
      () => useFeeCalculations(transactionMeta),
      {
        state: stakingDepositConfirmationState,
      },
    );
    expect(result.current).toMatchInlineSnapshot(`
        {
          "estimatedFeeFiat": "$0.34",
          "estimatedFeeNative": "0.0001 ETH",
          "preciseNativeFeeInHex": "0x5572e9c22d00",
        }
      `);
  });

  it('returns fee calculations less than $0.01', async () => {
    const clonedStakingDepositConfirmationState = cloneDeep(
      stakingDepositConfirmationState,
    );
    clonedStakingDepositConfirmationState.engine.backgroundState.CurrencyRateController.currencyRates.ETH =
      {
        conversionDate: 1732887955.694,
        conversionRate: 80,
        usdConversionRate: 80,
      };

    const { result } = renderHookWithProvider(
      () => useFeeCalculations(transactionMeta),
      {
        state: clonedStakingDepositConfirmationState,
      },
    );
    expect(result.current).toMatchInlineSnapshot(`
        {
          "estimatedFeeFiat": "< $0.01",
          "estimatedFeeNative": "0.0001 ETH",
          "preciseNativeFeeInHex": "0x5572e9c22d00",
        }
      `);
  });

  it('returns null as estimatedFeeFiat if conversion rate is not available', async () => {
    const clonedStakingDepositConfirmationState = cloneDeep(
      stakingDepositConfirmationState,
    );

    // No type is exported for CurrencyRate, so we need to cast it to the correct type
    clonedStakingDepositConfirmationState.engine.backgroundState.CurrencyRateController.currencyRates.ETH =
      null as unknown as {
        conversionDate: number;
        conversionRate: number;
        usdConversionRate: number;
      };

    const { result } = renderHookWithProvider(
      () => useFeeCalculations(transactionMeta),
      {
        state: clonedStakingDepositConfirmationState,
      },
    );
    expect(result.current).toMatchInlineSnapshot(`
        {
          "estimatedFeeFiat": null,
          "estimatedFeeNative": "0.0001 ETH",
          "preciseNativeFeeInHex": "0x5572e9c22d00",
        }
      `);
  });

  it('returns fee calculations including layer1GasFee (L1 + L2)', async () => {
    const clonedStateWithLayer1GasFee = cloneDeep(
      stakingDepositConfirmationState,
    );
    // Add a layer1GasFee to the transactionMeta
    const layer1GasFee = '0x1000'; // 4096 in hex, small value for test
    clonedStateWithLayer1GasFee.engine.backgroundState.TransactionController.transactions[0].layer1GasFee =
      layer1GasFee;

    const transactionMetaWithLayer1GasFee =
      clonedStateWithLayer1GasFee.engine.backgroundState.TransactionController
        .transactions[0];

    const { result } = renderHookWithProvider(
      () => useFeeCalculations(transactionMetaWithLayer1GasFee),
      {
        state: clonedStateWithLayer1GasFee,
      },
    );
    // The expected values are the sum of the original estimatedFee and layer1GasFee
    // The original estimatedFee is 0x5572e9c22d00, so the sum is 0x5572e9c23d00
    expect(result.current).toMatchInlineSnapshot(`
      {
        "estimatedFeeFiat": "$0.34",
        "estimatedFeeNative": "0.0001 ETH",
        "preciseNativeFeeInHex": "0x5572e9c23d00",
      }
    `);
  });

  describe('legacy (non-EIP-1559) gasPrice path', () => {
    it('uses gasPrice x gasLimitNoBuffer when the network does not support EIP-1559', () => {
      const state = cloneDeep(stakingDepositConfirmationState);
      state.engine.backgroundState.NetworkController.networksMetadata.mainnet.EIPS[1559] =
        false;
      state.engine.backgroundState.TransactionController.transactions[0].txParams =
        {
          ...state.engine.backgroundState.TransactionController.transactions[0]
            .txParams,
          gasPrice: LEGACY_GAS_PRICE,
        };

      const { result } = renderWithState(state);

      expect(result.current).toEqual({
        estimatedFeeFiat: '$1.29',
        estimatedFeeNative: '0.0004 ETH',
        preciseNativeFeeInHex: LEGACY_EXPECTED_FEE_HEX,
      });
    });

    it('uses gasPrice x gasLimitNoBuffer for a legacy envelope on an EIP-1559 network', () => {
      const state = cloneDeep(stakingDepositConfirmationState);
      state.engine.backgroundState.TransactionController.transactions[0].txParams =
        {
          ...state.engine.backgroundState.TransactionController.transactions[0]
            .txParams,
          gasPrice: LEGACY_GAS_PRICE,
          type: TransactionEnvelopeType.legacy,
        };

      const { result } = renderWithState(state);

      expect(result.current.preciseNativeFeeInHex).toBe(
        LEGACY_EXPECTED_FEE_HEX,
      );
    });

    it('returns a zero fee when gasPrice is missing on a non-EIP-1559 network', () => {
      const state = cloneDeep(stakingDepositConfirmationState);
      state.engine.backgroundState.NetworkController.networksMetadata.mainnet.EIPS[1559] =
        false;

      const { result } = renderWithState(state);

      expect(result.current).toEqual({
        estimatedFeeFiat: '$0.00',
        estimatedFeeNative: '0 ETH',
        preciseNativeFeeInHex: '0x0',
      });
    });
  });

  describe('estimatedBaseFee + maxPriorityFeePerGas vs maxFeePerGas', () => {
    beforeEach(() => {
      mockGetNetworkConfigurationByNetworkClientId.mockReturnValue({
        chainId: '0x1',
      } as unknown as ReturnType<typeof Engine.context.NetworkController.getNetworkConfigurationByNetworkClientId>);
    });

    it('uses estimatedBaseFee + maxPriorityFeePerGas when below maxFeePerGas', () => {
      // (657622129 + 1305306368) * 71977
      const { result } = renderWithState(
        cloneDeep(stakingDepositConfirmationState),
      );

      expect(result.current.preciseNativeFeeInHex).toBe('0x807fa4396c19');
    });

    it('clamps the per-gas fee to maxFeePerGas when estimatedBaseFee + maxPriorityFeePerGas exceeds it', () => {
      const state = cloneDeep(stakingDepositConfirmationState);
      // 2 gwei base fee + 1.305306368 gwei priority fee > 2.220444448 gwei max fee
      (
        state.engine.backgroundState.GasFeeController
          .gasFeeEstimatesByChainId?.['0x1']?.gasFeeEstimates as {
          estimatedBaseFee: string;
        }
      ).estimatedBaseFee = '2';

      const { result } = renderWithState(state);

      // maxFeePerGas * gasLimitNoBuffer = 2220444448 * 71977
      // (unclamped would be 3305306368 * 71977 = 0xd85fd0cae100)
      expect(result.current).toEqual({
        estimatedFeeFiat: '$0.57',
        estimatedFeeNative: '0.0002 ETH',
        preciseNativeFeeInHex: '0x915b35c32820',
      });
    });
  });
});
