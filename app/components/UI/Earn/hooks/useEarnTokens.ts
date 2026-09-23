import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useStakingEligibility from '../../Stake/hooks/useStakingEligibility';
import { TokenI } from '../../Tokens/types';
import { getSupportedEarnTokens, filterEligibleTokens } from '../utils';
import { selectAccountTokensAcrossChains } from '../../../../selectors/multichain';
import { isPortfolioViewEnabled } from '../../../../util/networks';
import { RootState } from '../../BasicFunctionality/BasicFunctionalityModal/BasicFunctionalityModal.test';
import { useEarnTokenDetails } from './useEarnTokenDetails';
import {
  selectPooledStakingEnabledFlag,
  selectStablecoinLendingEnabledFlag,
} from '../selectors/featureFlags';

// Identifies an earn token across chains without keeping a reference to it.
export const getEarnTokenKey = (symbol: string, chainId: TokenI['chainId']) =>
  `${symbol}-${chainId}`;

// Filters user's tokens to only return the supported and enabled earn tokens,
// without the (expensive) balance and APR details.
export const useEligibleEarnTokens = (): TokenI[] => {
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
    if (isLoadingStakingEligibility || !isPortfolioViewEnabled()) return [];

    const allTokens = Object.values(tokens).flat() as TokenI[];

    if (!allTokens.length) return [];

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

// Keys of the eligible earn tokens, for consumers that only need to know
// whether a given asset is an earn token.
export const useEarnTokenKeys = (): ReadonlySet<string> => {
  const eligibleTokens = useEligibleEarnTokens();

  return useMemo(
    () =>
      new Set(
        eligibleTokens.map((token) =>
          getEarnTokenKey(token.symbol, token.chainId),
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
    const eligibleTokensWithBalances = eligibleTokens?.map((token) =>
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
