import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import { CANCEL_RATE, SPEED_UP_RATE } from '@metamask/transaction-controller';
import { isHexString, Hex } from '@metamask/utils';
import BigNumber from 'bignumber.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { strings } from '../../../../../../../locales/i18n';
import AppConstants from '../../../../../../core/AppConstants';
import {
  startGasPolling,
  stopGasPolling,
} from '../../../../../../core/GasPolling/GasPolling';
import { selectAccounts } from '../../../../../../selectors/accountTrackerController';
import { selectSelectedInternalAccountFormattedAddress } from '../../../../../../selectors/accountsController';
import { selectGasFeeEstimates } from '../../../../../../selectors/confirmTransaction';
import { selectGasFeeControllerEstimateType } from '../../../../../../selectors/gasFeeController';
import { selectNativeCurrencyByChainId } from '../../../../../../selectors/networkController';
import { getDecimalChainId } from '../../../../../../util/networks';
import {
  addHexPrefix,
  fromWei,
  hexToBN,
  renderFromWei,
} from '../../../../../../util/number';
import { getTicker } from '../../../../../../util/transactions';
import EditGasFee1559Update, {
  EIP1559GasObject,
  EIP1559GasTransaction,
  EIP1559UpdateOption,
} from '../EditGasFee1559Update';
import { RootState } from '../../../../../../reducers';

interface UpdateEIP1559TxOwnProps {
  /**
   * Gas limit of the transaction being updated
   */
  gas: string;
  /**
   * Gas values of the transaction being updated
   */
  existingGas: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
  /**
   * Whether the transaction is being cancelled or sped up
   */
  isCancel?: boolean;
  /**
   * Chain id of the transaction being updated
   */
  chainId?: string;
  /**
   * Callback triggered when the update is cancelled
   */
  onCancel?: () => void;
  /**
   * Callback triggered when the update is saved
   */
  onSave?: (gasTxn: EIP1559GasTransaction) => void;
}

interface UpdateEIP1559TxStateProps {
  accounts: Record<string, { balance: string }>;
  selectedAddress?: string;
  ticker?: string;
  gasFeeEstimates: Record<string, EIP1559GasObject>;
  gasEstimateType: string;
  primaryCurrency?: string;
}

type UpdateEIP1559TxProps = UpdateEIP1559TxOwnProps & UpdateEIP1559TxStateProps;

const UpdateEIP1559Tx = ({
  gas,
  accounts,
  selectedAddress,
  ticker,
  existingGas,
  gasFeeEstimates,
  gasEstimateType,
  primaryCurrency,
  isCancel,
  chainId,
  onCancel,
  onSave,
}: UpdateEIP1559TxProps) => {
  const [animateOnGasChange, setAnimateOnGasChange] = useState(false);
  const [gasSelected, setGasSelected] = useState<string | null>(
    AppConstants.GAS_OPTIONS.MEDIUM,
  );
  const stopUpdateGas = useRef(false);
  /**
   * Flag to only display high gas selection option if the legacy is higher then low/med
   */
  const onlyDisplayHigh = useRef(false);
  /**
   * Options
   */
  const updateTx1559Options = useRef<EIP1559UpdateOption>();
  const pollToken = useRef<string>();
  const firstTime = useRef(true);

  const suggestedGasLimit = fromWei(gas, 'wei');

  useEffect(() => {
    if (animateOnGasChange) setAnimateOnGasChange(false);
  }, [animateOnGasChange]);

  useEffect(() => {
    const startGasEstimatePolling = async () => {
      pollToken.current = await startGasPolling(pollToken.current);
    };
    startGasEstimatePolling();

    return () => {
      stopGasPolling();
    };
  }, []);

  const isMaxFeePerGasMoreThanLegacy = useCallback(
    (maxFeePerGas: BigNumber) => {
      const newDecMaxFeePerGas = new BigNumber(existingGas.maxFeePerGas).times(
        new BigNumber(isCancel ? CANCEL_RATE : SPEED_UP_RATE),
      );
      return {
        result: maxFeePerGas.gte(newDecMaxFeePerGas),
        value: newDecMaxFeePerGas,
      };
    },
    [existingGas.maxFeePerGas, isCancel],
  );

  const isMaxPriorityFeePerGasMoreThanLegacy = useCallback(
    (maxPriorityFeePerGas: BigNumber) => {
      const newDecMaxPriorityFeePerGas = new BigNumber(
        existingGas.maxPriorityFeePerGas,
      ).times(new BigNumber(isCancel ? CANCEL_RATE : SPEED_UP_RATE));
      return {
        result: maxPriorityFeePerGas.gte(newDecMaxPriorityFeePerGas),
        value: newDecMaxPriorityFeePerGas,
      };
    },
    [existingGas.maxPriorityFeePerGas, isCancel],
  );

  const validateAmount = useCallback(
    (updateTx: EIP1559GasTransaction) => {
      let error;
      const totalMaxHexPrefixed = addHexPrefix(updateTx.totalMaxHex);

      if (!isHexString(totalMaxHexPrefixed)) {
        return strings('transaction.invalid_amount');
      }
      const updateTxCost = hexToBN(totalMaxHexPrefixed);
      const accountBalance = hexToBN(
        accounts[selectedAddress as string].balance,
      );
      const isMaxFeePerGasMoreThanLegacyResult = isMaxFeePerGasMoreThanLegacy(
        new BigNumber(updateTx.suggestedMaxFeePerGas as string),
      );
      const isMaxPriorityFeePerGasMoreThanLegacyResult =
        isMaxPriorityFeePerGasMoreThanLegacy(
          new BigNumber(updateTx.suggestedMaxPriorityFeePerGas as string),
        );
      if (accountBalance.lt(updateTxCost)) {
        const amount = renderFromWei(updateTxCost.sub(accountBalance));
        const tokenSymbol = getTicker(ticker);
        error = strings('transaction.insufficient_amount', {
          amount,
          tokenSymbol,
        });
      } else if (!isMaxFeePerGasMoreThanLegacyResult.result) {
        error = isCancel
          ? strings('edit_gas_fee_eip1559.max_fee_cancel_low', {
              cancel_value: isMaxFeePerGasMoreThanLegacyResult.value,
            })
          : strings('edit_gas_fee_eip1559.max_fee_speed_up_low', {
              speed_up_floor_value: isMaxFeePerGasMoreThanLegacyResult.value,
            });
      } else if (!isMaxPriorityFeePerGasMoreThanLegacyResult.result) {
        error = isCancel
          ? strings('edit_gas_fee_eip1559.max_priority_fee_cancel_low', {
              cancel_value: isMaxPriorityFeePerGasMoreThanLegacyResult.value,
            })
          : strings('edit_gas_fee_eip1559.max_priority_fee_speed_up_low', {
              speed_up_floor_value:
                isMaxPriorityFeePerGasMoreThanLegacyResult.value,
            });
      }

      return error;
    },
    [
      accounts,
      selectedAddress,
      isMaxFeePerGasMoreThanLegacy,
      isMaxPriorityFeePerGasMoreThanLegacy,
      ticker,
      isCancel,
    ],
  );

  useEffect(() => {
    if (stopUpdateGas.current) return;
    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      if (firstTime.current) {
        const newDecMaxFeePerGas = new BigNumber(
          existingGas.maxFeePerGas,
        ).times(new BigNumber(isCancel ? CANCEL_RATE : SPEED_UP_RATE));
        const newDecMaxPriorityFeePerGas = new BigNumber(
          existingGas.maxPriorityFeePerGas,
        ).times(new BigNumber(isCancel ? CANCEL_RATE : SPEED_UP_RATE));

        //Check to see if default SPEED_UP_RATE/CANCEL_RATE is greater than current market medium value
        if (
          !isMaxFeePerGasMoreThanLegacy(
            new BigNumber(
              gasFeeEstimates.medium.suggestedMaxPriorityFeePerGas as string,
            ),
          ).result ||
          !isMaxPriorityFeePerGasMoreThanLegacy(
            new BigNumber(
              gasFeeEstimates.medium.suggestedMaxFeePerGas as string,
            ),
          ).result
        ) {
          updateTx1559Options.current = {
            maxPriortyFeeThreshold: newDecMaxPriorityFeePerGas,
            maxFeeThreshold: newDecMaxFeePerGas,
            showAdvanced: true,
            isCancel,
          };

          onlyDisplayHigh.current = true;
          //Disable polling
          stopUpdateGas.current = true;
          setGasSelected('');
        } else {
          updateTx1559Options.current = {
            maxPriortyFeeThreshold:
              gasFeeEstimates.medium.suggestedMaxPriorityFeePerGas,
            maxFeeThreshold: gasFeeEstimates.medium.suggestedMaxFeePerGas,
            showAdvanced: false,
            isCancel,
          };
          setAnimateOnGasChange(true);
        }
      }

      firstTime.current = false;
    }
  }, [
    existingGas.maxFeePerGas,
    existingGas.maxPriorityFeePerGas,
    gasEstimateType,
    gasFeeEstimates,
    gasSelected,
    isCancel,
    gas,
    suggestedGasLimit,
    isMaxFeePerGasMoreThanLegacy,
    isMaxPriorityFeePerGasMoreThanLegacy,
  ]);

  const update1559TempGasValue = (selected: string | null) => {
    stopUpdateGas.current = !selected;
    setGasSelected(selected);
  };

  const onSaveTxnWithError = (gasTxn: EIP1559GasTransaction) => {
    gasTxn.error = validateAmount(gasTxn);
    (onSave as (gasTransaction: EIP1559GasTransaction) => void)(gasTxn);
  };

  const getGasAnalyticsParams = () => ({
    chain_id: getDecimalChainId(chainId),
    gas_estimate_type: gasEstimateType,
    gas_mode: gasSelected ? 'Basic' : 'Advanced',
    speed_set: gasSelected || undefined,
    view: isCancel ? AppConstants.CANCEL_RATE : AppConstants.SPEED_UP_RATE,
  });

  const selectedGasObject = {
    suggestedMaxFeePerGas: existingGas.maxFeePerGas,
    suggestedMaxPriorityFeePerGas: existingGas.maxPriorityFeePerGas,
    suggestedGasLimit,
  };
  return (
    <EditGasFee1559Update
      selectedGasValue={gasSelected as string}
      gasOptions={gasFeeEstimates}
      primaryCurrency={primaryCurrency}
      chainId={chainId}
      onChange={update1559TempGasValue}
      onCancel={onCancel}
      onSave={onSaveTxnWithError}
      ignoreOptions={
        onlyDisplayHigh.current
          ? [AppConstants.GAS_OPTIONS.LOW, AppConstants.GAS_OPTIONS.MEDIUM]
          : [AppConstants.GAS_OPTIONS.LOW]
      }
      updateOption={updateTx1559Options.current}
      analyticsParams={getGasAnalyticsParams()}
      animateOnChange={animateOnGasChange}
      selectedGasObject={selectedGasObject}
      onlyGas
    />
  );
};

const mapStateToProps = (
  state: RootState,
  ownProps: UpdateEIP1559TxOwnProps,
): UpdateEIP1559TxStateProps => ({
  accounts: selectAccounts(state),
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  ticker: selectNativeCurrencyByChainId(state, ownProps.chainId as Hex),
  gasFeeEstimates: selectGasFeeEstimates(state) as unknown as Record<
    string,
    EIP1559GasObject
  >,
  gasEstimateType: selectGasFeeControllerEstimateType(state),
  primaryCurrency: state.settings.primaryCurrency,
});

export default connect(mapStateToProps)(UpdateEIP1559Tx);
