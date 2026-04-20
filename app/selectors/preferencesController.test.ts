import {
  selectDisplayNftMedia,
  selectIpfsGateway,
  selectIsIpfsGatewayEnabled,
  selectIsMultiAccountBalancesEnabled,
  selectIsSecurityAlertsEnabled,
  selectIsTokenNetworkFilterEqualCurrentNetwork,
  selectPrivacyMode,
  selectShowIncomingTransactionNetworks,
  selectShowMultiRpcModal,
  selectShowTestNetworks,
  selectSmartTransactionsBannerDismissed,
  selectSmartTransactionsMigrationApplied,
  selectSmartTransactionsOptInStatus,
  selectTokenNetworkFilter,
  selectTokenSortConfig,
  selectUseNftDetection,
  selectUseSafeChainsListValidation,
  selectUseTokenDetection,
  selectUseTransactionSimulations,
} from './preferencesController';
import type { RootState } from '../reducers';

const makeState = (
  preferences: Record<string, unknown>,
  networkChainId = '0x1',
) =>
  ({
    engine: {
      backgroundState: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            [networkChainId]: {
              chainId: networkChainId,
              rpcEndpoints: [
                {
                  networkClientId: 'mainnet',
                  url: 'https://rpc',
                  type: 'custom',
                },
              ],
              defaultRpcEndpointIndex: 0,
            },
          },
        },
        PreferencesController: preferences,
      },
    },
  } as unknown as RootState);

describe('preferencesController selectors', () => {
  const prefs = {
    ipfsGateway: 'https://ipfs.io/ipfs/',
    useNftDetection: true,
    showMultiRpcModal: false,
    useTokenDetection: true,
    displayNftMedia: true,
    useSafeChainsListValidation: true,
    tokenSortConfig: { key: 'tokenValue', order: 'dsc' },
    tokenNetworkFilter: { '0x1': true },
    isMultiAccountBalancesEnabled: true,
    showTestNetworks: false,
    showIncomingTransactions: { '0x1': true },
    isIpfsGatewayEnabled: true,
    securityAlertsEnabled: true,
    smartTransactionsOptInStatus: true,
    useTransactionSimulations: true,
    privacyMode: false,
    featureFlags: {
      smartTransactionsMigrationApplied: true,
      smartTransactionsBannerDismissed: true,
    },
  };

  it('simple passthrough selectors return their preference field', () => {
    const state = makeState(prefs);
    expect(selectIpfsGateway(state)).toBe(prefs.ipfsGateway);
    expect(selectUseNftDetection(state)).toBe(true);
    expect(selectShowMultiRpcModal(state)).toBe(false);
    expect(selectUseTokenDetection(state)).toBe(true);
    expect(selectDisplayNftMedia(state)).toBe(true);
    expect(selectUseSafeChainsListValidation(state)).toBe(true);
    expect(selectTokenSortConfig(state)).toEqual(prefs.tokenSortConfig);
    expect(selectTokenNetworkFilter(state)).toEqual(prefs.tokenNetworkFilter);
    expect(selectIsMultiAccountBalancesEnabled(state)).toBe(true);
    expect(selectShowTestNetworks(state)).toBe(false);
    expect(selectShowIncomingTransactionNetworks(state)).toEqual(
      prefs.showIncomingTransactions,
    );
    expect(selectIsIpfsGatewayEnabled(state)).toBe(true);
    expect(selectIsSecurityAlertsEnabled(state)).toBe(true);
    expect(selectSmartTransactionsOptInStatus(state)).toBe(true);
    expect(selectUseTransactionSimulations(state)).toBe(true);
    expect(selectPrivacyMode(state)).toBe(false);
  });

  it('smart-transactions feature flag selectors default to false when featureFlags is missing', () => {
    const state = makeState({ ...prefs, featureFlags: undefined });
    expect(selectSmartTransactionsMigrationApplied(state)).toBe(false);
    expect(selectSmartTransactionsBannerDismissed(state)).toBe(false);
  });

  it('smart-transactions feature flag selectors return true when featureFlags are set', () => {
    const state = makeState(prefs);
    expect(selectSmartTransactionsMigrationApplied(state)).toBe(true);
    expect(selectSmartTransactionsBannerDismissed(state)).toBe(true);
  });

  it('selectIsTokenNetworkFilterEqualCurrentNetwork is true only when the single filter key matches current chain', () => {
    expect(
      selectIsTokenNetworkFilterEqualCurrentNetwork(
        makeState({ ...prefs, tokenNetworkFilter: { '0x1': true } }),
      ),
    ).toBe(true);

    expect(
      selectIsTokenNetworkFilterEqualCurrentNetwork(
        makeState({ ...prefs, tokenNetworkFilter: { '0x89': true } }),
      ),
    ).toBe(false);

    expect(
      selectIsTokenNetworkFilterEqualCurrentNetwork(
        makeState({
          ...prefs,
          tokenNetworkFilter: { '0x1': true, '0x89': true },
        }),
      ),
    ).toBe(false);

    expect(
      selectIsTokenNetworkFilterEqualCurrentNetwork(
        makeState({ ...prefs, tokenNetworkFilter: undefined }),
      ),
    ).toBe(false);
  });
});
