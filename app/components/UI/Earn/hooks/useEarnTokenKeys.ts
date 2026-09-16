import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useStakingEligibility from '../../Stake/hooks/useStakingEligibility';
import { TokenI } from '../../Tokens/types';
import { getSupportedEarnTokens, filterEligibleTokens } from '../utils';
import { selectAccountTokensAcrossChains } from '../../../../selectors/multichain';
import { isPortfolioViewEnabled } from '../../../../util/networks';
import { RootState } from '../../../../reducers';
import {
  selectPooledStakingEnabledFlag,
  selectStablecoinLendingEnabledFlag,
} from '../selectors/featureFlags';

/**
 * Builds the lookup key used by `useEarnTokenKeys` to identify a token.
 *
 * @param token - Token with `chainId` and `symbol`.
 * @returns `${chainId}:${symbol}`.
 */
export const getEarnTokenKey = (
  token: Pick<TokenI, 'chainId' | 'symbol'>,
): string => `${token.chainId}:${token.symbol}`;

// Lightweight variant of useEarnTokens that only derives the set of
// `${chainId}:${symbol}` keys for the user's earn-eligible tokens.
// Intended to be called once per list and shared with rows via props.
const useEarnTokenKeys = (): ReadonlySet<string> => {
  const tokens = useSelector((state: RootState) =>
    selectAccountTokensAcrossChains(state),
  );

  const isPooledStakingEnabled = useSelector(selectPooledStakingEnabledFlag);
  const isStablecoinLendingEnabled = useSelector(
    selectStablecoinLendingEnabledFlag,
  );

  const {
    isEligible: isEligibleToStake,
    isLoadingEligibility: isLoadingStakingEligibility,
  } = useStakingEligibility();

  return useMemo(() => {
    const keys = new Set<string>();

    if (isLoadingStakingEligibility || !isPortfolioViewEnabled()) return keys;

    const allTokens = Object.values(tokens).flat() as TokenI[];

    if (!allTokens.length) return keys;

    const eligibleTokens = filterEligibleTokens(
      getSupportedEarnTokens(allTokens),
      {
        canStake: isEligibleToStake && isPooledStakingEnabled,
        canLend: isStablecoinLendingEnabled,
      },
    );

    for (const token of eligibleTokens) {
      keys.add(getEarnTokenKey(token));
    }

    return keys;
  }, [
    isEligibleToStake,
    isLoadingStakingEligibility,
    isPooledStakingEnabled,
    isStablecoinLendingEnabled,
    tokens,
  ]);
};

export default useEarnTokenKeys;
