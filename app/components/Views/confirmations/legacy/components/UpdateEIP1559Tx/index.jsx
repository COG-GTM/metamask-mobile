import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
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
import { fromWei } from '../../../../../../util/number';
import EditGasFee1559Update from '../EditGasFee1559Update';
import { getInitialUpdateTx1559Options, validateUpdateTxAmount } from './utils';

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
}) => {
  const [animateOnGasChange, setAnimateOnGasChange] = useState(false);
  const [gasSelected, setGasSelected] = useState(
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
  const updateTx1559Options = useRef();
  const pollToken = useRef();
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

  const validateAmount = useCallback(
    (updateTx) =>
      validateUpdateTxAmount({
        updateTx,
        accountBalance: accounts[selectedAddress].balance,
        existingGas,
        isCancel,
        ticker,
      }),
    [accounts, selectedAddress, existingGas, isCancel, ticker],
  );

  useEffect(() => {
    if (stopUpdateGas.current) return;
    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      if (firstTime.current) {
        updateTx1559Options.current = getInitialUpdateTx1559Options({
          existingGas,
          mediumEstimate: gasFeeEstimates.medium,
          isCancel,
        });

        if (updateTx1559Options.current.showAdvanced) {
          onlyDisplayHigh.current = true;
          //Disable polling
          stopUpdateGas.current = true;
          setGasSelected('');
        } else {
          setAnimateOnGasChange(true);
        }
      }

      firstTime.current = false;
    }
  }, [
    existingGas,
    gasEstimateType,
    gasFeeEstimates,
    gasSelected,
    isCancel,
    gas,
    suggestedGasLimit,
  ]);

  const update1559TempGasValue = (selected) => {
    stopUpdateGas.current = !selected;
    setGasSelected(selected);
  };

  const onSaveTxnWithError = (gasTxn) => {
    gasTxn.error = validateAmount(gasTxn);
    onSave(gasTxn);
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
      selectedGasValue={gasSelected}
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

const mapStateToProps = (state, ownProps) => ({
  accounts: selectAccounts(state),
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  ticker: selectNativeCurrencyByChainId(state, ownProps.chainId),
  gasFeeEstimates: selectGasFeeEstimates(state),
  gasEstimateType: selectGasFeeControllerEstimateType(state),
  primaryCurrency: state.settings.primaryCurrency,
});

export default connect(mapStateToProps)(UpdateEIP1559Tx);
