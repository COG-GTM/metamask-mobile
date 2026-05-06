const tags = {
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
  smokeRamps: 'SmokeRamps:',
};

const Regression = (testName: string) => `${tags.regression} ${testName}`;
const SmokeAccounts = (testName: string) => `${tags.smokeAccounts} ${testName}`;
const SmokeCore = (testName: string) => `${tags.smokeCore} ${testName}`;
const SmokeConfirmations = (testName: string) =>
  `${tags.smokeConfirmations} ${testName}`;
const SmokeConfirmationsRedesigned = (testName: string) =>
  `${tags.smokeConfirmationsRedesigned} ${testName}`;
const SmokeSwaps = (testName: string) => `${tags.SmokeSwaps} ${testName}`;
const SmokeStake = (testName: string) => `${tags.smokeStake} ${testName}`;
const SmokeAssets = (testName: string) => `${tags.smokeAssets} ${testName}`;
const SmokeIdentity = (testName: string) => `${tags.smokeIdentity} ${testName}`;
const SmokeRamps = (testName: string) => `${tags.smokeRamps} ${testName}`;
const SmokeMultiChainPermissions = (testName: string) =>
  `${tags.smokeMultiChainPermissions} ${testName}`;
const SmokeNotifications = (testName: string) =>
  `${tags.smokeNotifications} ${testName}`;
const SmokeAnalytics = (testName: string) => `${tags.smokeAnalytics} ${testName}`;


const SmokeTrade = (testName: string) => `${tags.SmokeTrade} ${testName}`;
const SmokeWalletPlatform = (testName: string) => `${tags.SmokeWalletPlatform} ${testName}`;

const SmokeNetworkAbstractions = (testName: string) =>
  `${tags.SmokeNetworkAbstractions} ${testName}`;
const SmokeNetworkExpansion = (testName: string) =>
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
