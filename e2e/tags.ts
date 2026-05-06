interface Tags {
  regression: string;
  smokeAccounts: string;
  smokeCore: string;
  smokeConfirmations: string;
  smokeConfirmationsRedesigned: string;
  SmokeSwaps: string;
  SmokeRest: string;
  smokeAssets: string;
  smokeIdentity: string;
  smokeMultiChainPermissions: string;
  SmokeTrade: string;
  SmokeNetworkAbstractions: string;
  SmokeWalletPlatform: string;
  SmokeNetworkExpansion: string;
  smokeStake: string;
  smokeNotifications: string;
  smokeAnalytics: string;
  smokeRamps?: string;
}

const tags: Tags = {
  regression: 'Regression:',
  smokeAccounts: 'SmokeAccounts:',
  smokeCore: 'SmokeCore:',
  smokeConfirmations: 'SmokeConfirmations:',
  smokeConfirmationsRedesigned: 'SmokeConfirmationsRedesigned:',
  SmokeSwaps: 'SmokeSwaps:',
  SmokeRest: 'SmokeRest:',
  smokeAssets: 'smokeAssets:',
  smokeIdentity: 'SmokeIdentity:',
  smokeMultiChainPermissions: 'SmokeMultiChainPermissions:',
  SmokeTrade: 'Trade:',
  SmokeNetworkAbstractions: 'NetworkAbstractions:',
  SmokeWalletPlatform: 'WalletPlatform:',
  SmokeNetworkExpansion: 'NetworkExpansion:',
  smokeStake: 'SmokeStake:',
  smokeNotifications: 'SmokeNotifications:',
  smokeAnalytics: 'SmokeAnalytics:',
};

const Regression = (testName: string): string =>
  `${tags.regression} ${testName}`;
const SmokeAccounts = (testName: string): string =>
  `${tags.smokeAccounts} ${testName}`;
const SmokeCore = (testName: string): string => `${tags.smokeCore} ${testName}`;
const SmokeConfirmations = (testName: string): string =>
  `${tags.smokeConfirmations} ${testName}`;
const SmokeConfirmationsRedesigned = (testName: string): string =>
  `${tags.smokeConfirmationsRedesigned} ${testName}`;
const SmokeSwaps = (testName: string): string =>
  `${tags.SmokeSwaps} ${testName}`;
const SmokeStake = (testName: string): string =>
  `${tags.smokeStake} ${testName}`;
const SmokeAssets = (testName: string): string =>
  `${tags.smokeAssets} ${testName}`;
const SmokeIdentity = (testName: string): string =>
  `${tags.smokeIdentity} ${testName}`;
const SmokeRamps = (testName: string): string =>
  `${tags.smokeRamps} ${testName}`;
const SmokeMultiChainPermissions = (testName: string): string =>
  `${tags.smokeMultiChainPermissions} ${testName}`;
const SmokeNotifications = (testName: string): string =>
  `${tags.smokeNotifications} ${testName}`;
const SmokeAnalytics = (testName: string): string =>
  `${tags.smokeAnalytics} ${testName}`;

const SmokeTrade = (testName: string): string =>
  `${tags.SmokeTrade} ${testName}`;
const SmokeWalletPlatform = (testName: string): string =>
  `${tags.SmokeWalletPlatform} ${testName}`;

const SmokeNetworkAbstractions = (testName: string): string =>
  `${tags.SmokeNetworkAbstractions} ${testName}`;
const SmokeNetworkExpansion = (testName: string): string =>
  `${tags.SmokeNetworkExpansion} ${testName}`;

export {
  Regression,
  SmokeAccounts,
  SmokeCore,
  SmokeConfirmations,
  SmokeConfirmationsRedesigned,
  SmokeSwaps,
  SmokeStake,
  SmokeAssets,
  SmokeIdentity,
  SmokeMultiChainPermissions,
  SmokeTrade,
  SmokeNetworkAbstractions,
  SmokeNetworkExpansion,
  SmokeWalletPlatform,
  SmokeRamps,
  SmokeNotifications,
  SmokeAnalytics,
};
