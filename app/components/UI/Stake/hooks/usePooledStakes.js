import { useMemo, useState } from 'react';

import Engine from '../../../../core/Engine';
import { useSelector } from 'react-redux';
import { pooledStakingSelectors } from '../../../../selectors/earnController';

export let StakeAccountStatus = /*#__PURE__*/function (StakeAccountStatus) {
  // These statuses are only used internally rather than displayed to a user
  StakeAccountStatus["ACTIVE"] = "ACTIVE"; // non-zero staked shares
  StakeAccountStatus["NEVER_STAKED"] = "NEVER_STAKED";StakeAccountStatus["INACTIVE_WITH_EXIT_REQUESTS"] = "INACTIVE_WITH_EXIT_REQUESTS";
  // zero staked shares, unstaking or claimable exit requests
  StakeAccountStatus["INACTIVE_WITH_REWARDS_ONLY"] = "INACTIVE_WITH_REWARDS_ONLY"; // zero staked shares, no exit requests, previous lifetime rewards
  return StakeAccountStatus;}({});

const usePooledStakes = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { selectPoolStakes, selectExchangeRate } = pooledStakingSelectors;

  const pooledStakesData = useSelector(selectPoolStakes);
  const exchangeRate = useSelector(selectExchangeRate);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Engine.context.EarnController.refreshPooledStakes({
        resetCache: true
      });
    } catch (err) {
      setError('Failed to fetch pooled stakes');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = (stake) => {
    if (stake.assets === '0' && stake.exitRequests.length > 0) {
      return StakeAccountStatus.INACTIVE_WITH_EXIT_REQUESTS;
    } else if (stake.assets === '0' && stake.lifetimeRewards !== '0') {
      return StakeAccountStatus.INACTIVE_WITH_REWARDS_ONLY;
    } else if (stake.assets === '0') {
      return StakeAccountStatus.NEVER_STAKED;
    }
    return StakeAccountStatus.ACTIVE;
  };

  const statusFlags = useMemo(() => {
    const currentStatus = pooledStakesData ?
    getStatus(pooledStakesData) :
    StakeAccountStatus.NEVER_STAKED;

    return {
      hasStakedPositions:
      currentStatus === StakeAccountStatus.ACTIVE ||
      currentStatus === StakeAccountStatus.INACTIVE_WITH_EXIT_REQUESTS,
      hasRewards:
      currentStatus === StakeAccountStatus.INACTIVE_WITH_REWARDS_ONLY ||
      currentStatus === StakeAccountStatus.ACTIVE,
      hasRewardsOnly:
      currentStatus === StakeAccountStatus.INACTIVE_WITH_REWARDS_ONLY,
      hasNeverStaked: currentStatus === StakeAccountStatus.NEVER_STAKED,
      hasEthToUnstake: currentStatus === StakeAccountStatus.ACTIVE
    };
  }, [pooledStakesData]);

  return {
    pooledStakesData,
    exchangeRate,
    isLoadingPooledStakesData: isLoading,
    error,
    refreshPooledStakes: fetchData,
    ...statusFlags
  };
};

export default usePooledStakes;