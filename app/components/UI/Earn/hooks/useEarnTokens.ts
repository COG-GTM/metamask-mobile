import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useStakingEligibility from '../../Stake/hooks/useStakingEligibility';
import { TokenI } from '../../Tokens/types';
import {
  getSupportedEarnTokens,
  filterEligibleTokens,
  getEarnTokenKey,
} from '../utils';
import { selectAccountTokensAcrossChains } from '../../../../selectors/multichain';
import { isPortfolioViewEnabled } from '../../../../util/networks';
import { useEarnTokenDetails } from './useEarnTokenDetails';
import {
  selectPooledStakingEnabledFlag,
  selectStablecoinLendingEnabledFlag,
} from '../selectors/featureFlags';

const EMPTY_EARN_TOKENS: TokenI[] = [];

// Filters user's tokens to the supported and enabled earn tokens, without balance/APR details.
const useEligibleEarnTokens = (): TokenI[] => {
  const tokens = useSelector(selectAccountTokensAcrossChains);

  const isPooledStakingEnabled = useSelector(selectPooledStakingEnabledFlag);
  const isStablecoinLendingEnabled = useSelector(
    selectStablecoinLendingEnabledFlag,
  );

  const {
    isEligible: isEligibleToStake,
    isLoadingEligibility: isLoadingStakingEligibility,
  } = useStakingEligibility();

  return useMemo(() => {
    if (isLoadingStakingEligibility || !isPortfolioViewEnabled()) {
      return EMPTY_EARN_TOKENS;
    }

    const allTokens = Object.values(tokens).flat() as TokenI[];

    if (!allTokens.length) return EMPTY_EARN_TOKENS;

    const supportedTokens = getSupportedEarnTokens(allTokens);

    return filterEligibleTokens(
      supportedTokens,
      // TODO: Add eligibility check for stablecoin lending before launch.
      {
        canStake: isEligibleToStake && isPooledStakingEnabled,
        canLend: isStablecoinLendingEnabled,
      },
    );
  }, [
    isEligibleToStake,
    isLoadingStakingEligibility,
    isPooledStakingEnabled,
    isStablecoinLendingEnabled,
    tokens,
  ]);
};

/**
 * Set of `getEarnTokenKey(chainId, symbol)` keys for the user's earn-eligible tokens.
 * Meant to be computed once per list and passed to rows, instead of calling
 * `useEarnTokens()` in every row.
 */
export const useEarnTokenKeys = (): ReadonlySet<string> => {
  const eligibleTokens = useEligibleEarnTokens();

  return useMemo(
    () =>
      new Set(
        eligibleTokens.map((token) =>
          getEarnTokenKey(token.chainId, token.symbol),
        ),
      ),
    [eligibleTokens],
  );
};

// Filters user's tokens to only return the supported and enabled earn tokens.
const useEarnTokens = () => {
  const eligibleTokens = useEligibleEarnTokens();

  const { getTokenWithBalanceAndApr } = useEarnTokenDetails();

  const supportedStablecoins = useMemo(() => {
    const eligibleTokensWithBalances = eligibleTokens.map((token) =>
      getTokenWithBalanceAndApr(token),
    );

    // Tokens with a balance of 0 are placed at the end of the list.
    return eligibleTokensWithBalances.sort((a, b) => {
      const fiatBalanceA = parseFloat(a.balanceFormatted);
      const fiatBalanceB = parseFloat(b.balanceFormatted);

      return (fiatBalanceA === 0 ? 1 : 0) - (fiatBalanceB === 0 ? 1 : 0);
    });
  }, [eligibleTokens, getTokenWithBalanceAndApr]);

  return supportedStablecoins;
};

export default useEarnTokens;
