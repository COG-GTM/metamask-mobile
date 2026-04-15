import { useCallback, useEffect, useState } from 'react';
import { selectSelectedInternalAccountFormattedAddress } from '../../../../selectors/accountsController';
import { useSelector } from 'react-redux';
import { hexToNumber } from '@metamask/utils';

import { stakingApiService } from '../sdk/stakeSdkProvider';










const useStakingEarningsHistory = ({
  chainId,
  limitDays = 365



}) => {
  const numericChainId = hexToNumber(chainId);
  const [earningsHistory, setEarningsHistory] = useState(

    null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedAddress =
  useSelector(selectSelectedInternalAccountFormattedAddress) || '';
  const fetchEarningsHistory = useCallback(async () => {
    if (stakingApiService) {
      setIsLoading(true);
      setError(null);

      try {
        const earningHistoryResponse =
        await stakingApiService.getUserDailyRewards(
          numericChainId,
          selectedAddress,
          limitDays
        );
        setEarningsHistory(earningHistoryResponse.userRewards);
      } catch (err) {
        setError('Failed to fetch earnings history');
      } finally {
        setIsLoading(false);
      }
    }
  }, [numericChainId, selectedAddress, limitDays]);

  useEffect(() => {
    fetchEarningsHistory();
  }, [fetchEarningsHistory]);

  return {
    earningsHistory,
    isLoading,
    error
  };
};

export default useStakingEarningsHistory;