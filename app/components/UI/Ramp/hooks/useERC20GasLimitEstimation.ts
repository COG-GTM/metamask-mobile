import { useState, useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { TransactionParams } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';
import useInterval from '../../../hooks/useInterval';
import { getGasLimit } from '../../../../util/custom-gas';
import { safeToChecksumAddress } from '../../../../util/address';
import { generateTransferData } from '../../../../util/transactions';
import { addHexPrefix, BN } from 'ethereumjs-util';
import { toTokenMinimalUnit } from '../../../../util/number';

const TRANSFER_GAS_LIMIT = 21000;
const POLLING_INTERVAL = 15000; // 15s

interface Options {
  tokenAddress?: string;
  fromAddress: string;
  chainId: string;
  amount: string;
  decimals: number;
  isNativeToken: boolean;
}

const isBackgroundState = (state: AppStateStatus) =>
  state === 'background' || state === 'inactive';

function useIsAppActive() {
  const [isAppActive, setIsAppActive] = useState(
    () => !isBackgroundState(AppState.currentState),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        setIsAppActive(!isBackgroundState(nextAppState));
      },
    );
    return () => subscription.remove();
  }, []);

  return isAppActive;
}

/**
 * Returns the estimated gas limit for an ERC20 transfer.
 * Polling only runs while the screen is focused and the app is in the foreground.
 *
 * @param options - The options object
 * @param options.tokenAddress - The token address. If provided, will estimate gas limit for ERC20 transfer
 * @param options.fromAddress - The address of the sender. Needs to be provided to estimate gas limit for ERC20 transfer
 * @param options.chainId - The chain ID for the network. Required for accurate ERC20 gas estimation
 * @param options.amount - The amount of the token to transfer. Required for accurate ERC20 gas estimation
 * @returns The estimated gas limit as a number
 */
function useERC20GasLimitEstimation({
  tokenAddress,
  fromAddress,
  chainId,
  amount,
  decimals,
  isNativeToken,
}: Options) {
  const [estimatedGasLimit, setEstimatedGasLimit] =
    useState(TRANSFER_GAS_LIMIT);
  const isFocused = useIsFocused();
  const isAppActive = useIsAppActive();
  const shouldPoll = !isNativeToken && isFocused && isAppActive;

  const estimateERC20GasLimit = useCallback(() => {
    if (!tokenAddress || isNativeToken) {
      return;
    }

    const estimateGas = async () => {
      try {
        const amountInMinimalUnit = toTokenMinimalUnit(amount, decimals);
        const amountHex = addHexPrefix(
          new BN(amountInMinimalUnit.toString()).toString('hex'),
        );

        const dummyToAddress = '0x1234567890123456789012345678901234567890';

        const transaction: TransactionParams = {
          from: safeToChecksumAddress(fromAddress) as string,
          to: safeToChecksumAddress(tokenAddress),
          value: '0x0',
          data: generateTransferData('transfer', {
            toAddress: safeToChecksumAddress(dummyToAddress),
            amount: amountHex,
          }),
          chainId: toHex(chainId),
        };

        const gasLimitResponse = await getGasLimit(transaction);
        setEstimatedGasLimit(gasLimitResponse.gas.toNumber());
      } catch (error) {
        console.error('Failed to estimate ERC20 transfer gas limit:', error);
      }
    };

    estimateGas();
  }, [tokenAddress, fromAddress, amount, decimals, chainId, isNativeToken]);

  useInterval(
    () => {
      estimateERC20GasLimit();
    },
    { delay: shouldPoll ? POLLING_INTERVAL : null, immediate: true },
  );

  return estimatedGasLimit;
}

export default useERC20GasLimitEstimation;
