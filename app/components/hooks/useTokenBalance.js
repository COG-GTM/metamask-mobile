import { useState, useEffect } from 'react';
import Engine from '../../core/Engine';


/**
 * Hook to handle the balance of ERC20 tokens
 * @property requestedTokenAddress Token contract address
 * @property userCurrentAddress Public address which holds the token
 * @returns Array that consists of `[balance, loading, error]`
 */

const useTokenBalance = (
requestedTokenAddress,
userCurrentAddress) =>
{
  // This hook should be only used with ERC20 tokens
  const [tokenBalance, setTokenBalance] =


  useState(null);
  const [loading, setLoading] =
  useState(true);
  const [error, setError] =
  useState(false);
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { AssetsContractController } = Engine.context;

  const fetchBalance = async (
  tokenAddress,
  userAddress) =>
  {
    AssetsContractController.getERC20BalanceOf(tokenAddress, userAddress).
    then((balance) => setTokenBalance(balance)).
    catch(() => setError(true)).
    finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBalance(requestedTokenAddress, userCurrentAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedTokenAddress, userCurrentAddress]);

  return [tokenBalance, loading, error];
};

export default useTokenBalance;