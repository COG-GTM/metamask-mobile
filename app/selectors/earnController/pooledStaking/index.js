import { createSelector } from 'reselect';


import { createDeepEqualSelector } from '../../util';

import BigNumber from 'bignumber.js';
import {
  CommonPercentageInputUnits,
  formatPercent,
  PercentageOutputFormat } from
'../../../components/UI/Stake/utils/value';

// Raw State Selectors
const selectEarnControllerState = (state) =>
state.engine.backgroundState.EarnController;

const selectEligibility = createSelector(
  selectEarnControllerState,
  (earnControllerState) =>
  earnControllerState.pooled_staking.isEligible
);

const selectVaultMetadata = createDeepEqualSelector(
  selectEarnControllerState,
  (earnControllerState) =>
  earnControllerState.pooled_staking.vaultMetadata
);

const selectPoolStakes = createDeepEqualSelector(
  selectEarnControllerState,
  (earnControllerState) =>
  earnControllerState.pooled_staking.pooledStakes
);

const selectExchangeRate = createSelector(
  selectEarnControllerState,
  (earnControllerState) =>
  earnControllerState.pooled_staking.exchangeRate
);

const selectVaultDailyApys = createDeepEqualSelector(
  selectEarnControllerState,
  (earnControllerSate) =>
  earnControllerSate.pooled_staking.vaultDailyApys
);

const selectVaultApyAverages = createDeepEqualSelector(
  selectEarnControllerState,
  (earnControllerSate) =>
  earnControllerSate.pooled_staking.vaultApyAverages
);

// Derived State Selectors
const selectVaultApy = createSelector(
  selectVaultApyAverages,
  (vaultApyAverages) => {
    const { oneWeek } = vaultApyAverages;

    const apyPercentString = formatPercent(oneWeek, {
      inputFormat: CommonPercentageInputUnits.PERCENTAGE,
      outputFormat: PercentageOutputFormat.PERCENT_SIGN,
      fixed: 1
    });

    const apyDecimal = new BigNumber(oneWeek).dividedBy(100).toNumber();

    return {
      // e.g. "2.5%"
      apyPercentString,
      // 0.02522049624725908
      apyDecimal
    };
  }
);

export const pooledStakingSelectors = {
  selectEligibility,
  selectVaultMetadata,
  selectPoolStakes,
  selectExchangeRate,
  selectVaultDailyApys,
  selectVaultApyAverages,
  selectVaultApy
};