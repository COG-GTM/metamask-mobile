
import { useStakeContext } from '../useStakeContext';
import trackErrorAsAnalytics from '../../../../../util/metrics/TrackError/trackErrorAsAnalytics';
import {
  TransactionType,
  WalletDevice } from
'@metamask/transaction-controller';
import { addTransaction } from '../../../../../util/transaction-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  generateClaimTxParams,
  isRequestClaimable,
  transformAggregatedClaimableExitRequestToMulticallArgs } from
'./utils';



const attemptMultiCallClaimTransaction = async (
pooledStakesData,
poolStakingContract,
activeAccountAddress,
networkClientId) =>
{
  const multiCallData = transformAggregatedClaimableExitRequestToMulticallArgs(
    pooledStakesData.exitRequests
  );

  const gasLimit = await poolStakingContract.estimateMulticallGas(
    multiCallData,
    activeAccountAddress
  );

  const { data, chainId } =
  await poolStakingContract.encodeMulticallTransactionData(
    multiCallData,
    activeAccountAddress,
    { gasLimit }
  );

  const txParams = generateClaimTxParams(
    activeAccountAddress,
    poolStakingContract.contract.address,
    data,
    chainId,
    gasLimit.toString()
  );

  return addTransaction(txParams, {
    deviceConfirmedOn: WalletDevice.MM_MOBILE,
    networkClientId,
    origin: ORIGIN_METAMASK,
    type: TransactionType.stakingClaim
  });
};

const attemptSingleClaimTransaction = async (
pooledStakesData,
poolStakingContract,
activeAccountAddress,
networkClientId) =>
{
  const { positionTicket, timestamp, exitQueueIndex } =
  pooledStakesData.exitRequests[0];

  if (!isRequestClaimable(exitQueueIndex, timestamp)) return;

  const gasLimit = await poolStakingContract.estimateClaimExitedAssetsGas(
    positionTicket,
    timestamp,
    exitQueueIndex,
    activeAccountAddress
  );

  const { data, chainId } =
  await poolStakingContract.encodeClaimExitedAssetsTransactionData(
    positionTicket,
    timestamp,
    exitQueueIndex,
    activeAccountAddress,
    {
      gasLimit
    }
  );

  const txParams = generateClaimTxParams(
    activeAccountAddress,
    poolStakingContract.contract.address,
    data,
    chainId,
    gasLimit.toString()
  );

  return addTransaction(txParams, {
    deviceConfirmedOn: WalletDevice.MM_MOBILE,
    networkClientId,
    origin: ORIGIN_METAMASK,
    type: TransactionType.stakingClaim
  });
};

const attemptPoolStakedClaimTransaction =
(
poolStakingContract,
networkClientId) =>

async (activeAccountAddress, pooledStakesData) => {
  try {
    if (pooledStakesData.exitRequests.length === 0) return;

    const isMultiCallClaim = pooledStakesData.exitRequests.length > 1;

    return isMultiCallClaim ?
    await attemptMultiCallClaimTransaction(
      pooledStakesData,
      poolStakingContract,
      activeAccountAddress,
      networkClientId
    ) :
    await attemptSingleClaimTransaction(
      pooledStakesData,
      poolStakingContract,
      activeAccountAddress,
      networkClientId
    );
  } catch (e) {
    const errorMessage = e.message;
    trackErrorAsAnalytics(
      'Pooled Staking Claim Transaction Failed',
      errorMessage
    );
  }
};

const usePoolStakedClaim = () => {
  const { networkClientId, stakingContract } =
  useStakeContext();

  return {
    attemptPoolStakedClaimTransaction: attemptPoolStakedClaimTransaction(
      stakingContract,
      networkClientId
    )
  };
};

export default usePoolStakedClaim;