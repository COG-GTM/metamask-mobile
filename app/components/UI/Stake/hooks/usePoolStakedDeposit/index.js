import { useCallback } from 'react';

import {

  TransactionType,
  WalletDevice } from
'@metamask/transaction-controller';
import { ORIGIN_METAMASK, toHex } from '@metamask/controller-utils';
import { formatEther } from 'ethers/lib/utils';

import { addTransaction } from '../../../../../util/transaction-controller';
import trackErrorAsAnalytics from '../../../../../util/metrics/TrackError/trackErrorAsAnalytics';
import { MetaMetricsEvents, useMetrics } from '../../../../hooks/useMetrics';

import { EVENT_PROVIDERS } from '../../constants/events';
import { useStakeContext } from '../useStakeContext';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const generateDepositTxParams = (
valueWei,
activeAccountAddress,
contractAddress,
encodedDepositTransactionData,
chainId) => (
{
  to: contractAddress,
  from: activeAccountAddress,
  chainId: `0x${chainId}`,
  data: encodedDepositTransactionData,
  value: toHex(valueWei.toString())
});

const attemptDepositTransaction =
(
pooledStakingContract,
networkClientId,
trackEvent,
createEventBuilder) =>

async (
depositValueWei,
receiver, // the address that can claim exited ETH
referrer = ZERO_ADDRESS, // any address to track referrals or deposits from different interfaces (can use zero address if not needed)
isRedesigned = false) =>
{
  try {
    const gasLimit = await pooledStakingContract.estimateDepositGas(
      formatEther(depositValueWei),
      receiver,
      referrer
    );

    const encodedDepositTransactionData =
    await pooledStakingContract.encodeDepositTransactionData(
      formatEther(depositValueWei),
      receiver,
      referrer,
      {
        gasLimit
      }
    );

    const { data, chainId } = encodedDepositTransactionData;

    const txParams = generateDepositTxParams(
      depositValueWei,
      receiver,
      pooledStakingContract.contract.address,
      data,
      chainId
    );

    if (isRedesigned) {
      trackEvent(
        createEventBuilder(MetaMetricsEvents.STAKE_TRANSACTION_INITIATED).
        addProperties({
          is_redesigned: true,
          selected_provider: EVENT_PROVIDERS.CONSENSYS,
          transaction_amount_eth: formatEther(depositValueWei)
        }).
        build()
      );
    }
    return await addTransaction(txParams, {
      deviceConfirmedOn: WalletDevice.MM_MOBILE,
      networkClientId,
      origin: ORIGIN_METAMASK,
      type: TransactionType.stakingDeposit
    });
  } catch (e) {
    const errorMessage = e.message;
    trackErrorAsAnalytics('Pooled Staking Transaction Failed', errorMessage);
  }
};

const usePoolStakedDeposit = () => {
  const { networkClientId, stakingContract } =
  useStakeContext();
  const { trackEvent, createEventBuilder } = useMetrics();

  // Linter is complaining that function may use other dependencies
  // We will simply ignore since we don't want to use inline function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedAttemptDepositTransaction = useCallback(
    attemptDepositTransaction(
      stakingContract,
      networkClientId,
      trackEvent,
      createEventBuilder
    ),
    [stakingContract, networkClientId, trackEvent, createEventBuilder]
  );

  return {
    attemptDepositTransaction: memoizedAttemptDepositTransaction
  };
};

export default usePoolStakedDeposit;