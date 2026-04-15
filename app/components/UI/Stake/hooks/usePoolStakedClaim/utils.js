
import { BigNumber } from 'ethers';


import { toHex } from '@metamask/controller-utils';

const TWENTY_FOUR_HOURS_IN_SECONDS = 86400;
const CLAIM_EXITED_ASSETS = 'claimExitedAssets';

export const have24HoursPassed = (timestamp) => {
  const current = Math.floor(Number(new Date().getTime() / 1000));
  const timestampInSeconds = Math.floor(Number(timestamp) / 1000);

  const difference = Number(current) - Number(timestampInSeconds);

  return difference > TWENTY_FOUR_HOURS_IN_SECONDS;
};

export const isRequestClaimable = (
exitQueueIndex,
timestamp) =>
{
  const isValidExitQueueIndex = exitQueueIndex && exitQueueIndex !== '-1';
  return isValidExitQueueIndex && have24HoursPassed(timestamp);
};

export const transformAggregatedClaimableExitRequestToMulticallArgs = (
exitRequests) =>
{
  const result = [];

  for (const { positionTicket, timestamp, exitQueueIndex } of exitRequests) {
    // claimExitedAssets rules: https://docs.google.com/document/d/1LJYXaTxdOaze8F7PwgJDG10yWw9xW0Vqinq2Nyn2Hp4/edit?tab=t.0#heading=h.a8yj0zi6pn8h
    if (!isRequestClaimable(exitQueueIndex, timestamp)) continue;

    const claim = {
      functionName: CLAIM_EXITED_ASSETS,
      args: [
      BigNumber.from(positionTicket).toString(),
      // Convert timestamp from milliseconds to seconds.
      BigNumber.from(timestamp).div(1000).toString(),
      BigNumber.from(exitQueueIndex).toString()]

    };

    result.push(claim);
  }

  return result;
};

export const generateClaimTxParams = (
activeAccountAddress,
contractAddress,
encodedClaimTransactionData,
chainId,
gasLimit) => (
{
  to: contractAddress,
  from: activeAccountAddress,
  chainId: `0x${chainId}`,
  data: encodedClaimTransactionData,
  value: '0',
  gas: toHex(gasLimit)
});