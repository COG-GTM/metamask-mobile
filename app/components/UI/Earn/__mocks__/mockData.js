

const mockEnabledEarnLDFlag = {
  enabled: true,
  minimumVersion: '0.0.0'
};

const mockedPooledStakingFeatureFlagState =


{
  earnPooledStakingEnabled: mockEnabledEarnLDFlag,
  earnPooledStakingServiceInterruptionBannerEnabled: mockEnabledEarnLDFlag
};

const mockedStablecoinLendingFeatureFlagState =


{
  earnStablecoinLendingEnabled: mockEnabledEarnLDFlag,
  earnStablecoinLendingServiceInterruptionBannerEnabled: mockEnabledEarnLDFlag
};

export const mockedEarnFeatureFlagsEnabledState = {
  ...mockedPooledStakingFeatureFlagState,
  ...mockedStablecoinLendingFeatureFlagState
};