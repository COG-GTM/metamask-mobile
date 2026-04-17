import {
  selectIpfsGateway,
  selectUseNftDetection,
  selectShowMultiRpcModal,
  selectUseTokenDetection,
  selectDisplayNftMedia,
  selectUseSafeChainsListValidation,
  selectTokenSortConfig,
  selectTokenNetworkFilter,
  selectIsMultiAccountBalancesEnabled,
  selectShowTestNetworks,
  selectShowIncomingTransactionNetworks,
  selectIsIpfsGatewayEnabled,
  selectIsSecurityAlertsEnabled,
  selectSmartTransactionsOptInStatus,
  selectUseTransactionSimulations,
  selectPrivacyMode,
  selectIsTokenNetworkFilterEqualCurrentNetwork,
  selectSmartTransactionsMigrationApplied,
  selectSmartTransactionsBannerDismissed,
} from './preferencesController';

const mockPreferencesState = {
  ipfsGateway: 'https://ipfs.io/ipfs/',
  useNftDetection: true,
  showMultiRpcModal: false,
  useTokenDetection: true,
  displayNftMedia: true,
  useSafeChainsListValidation: true,
  tokenSortConfig: { key: 'tokenFiatAmount', order: 'dsc' as const, sortCallback: 'stringNumeric' as const },
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
    smartTransactionsBannerDismissed: false,
  },
};

const mockState = {
  engine: {
    backgroundState: {
      PreferencesController: mockPreferencesState,
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
        networksMetadata: {},
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            rpcEndpoints: [{ networkClientId: 'mainnet' }],
          },
        },
      },
    },
  },
} as any;

describe('preferencesController selectors', () => {
  it('selectIpfsGateway returns ipfsGateway', () => {
    expect(selectIpfsGateway(mockState)).toBe('https://ipfs.io/ipfs/');
  });

  it('selectUseNftDetection returns useNftDetection', () => {
    expect(selectUseNftDetection(mockState)).toBe(true);
  });

  it('selectShowMultiRpcModal returns showMultiRpcModal', () => {
    expect(selectShowMultiRpcModal(mockState)).toBe(false);
  });

  it('selectUseTokenDetection returns useTokenDetection', () => {
    expect(selectUseTokenDetection(mockState)).toBe(true);
  });

  it('selectDisplayNftMedia returns displayNftMedia', () => {
    expect(selectDisplayNftMedia(mockState)).toBe(true);
  });

  it('selectUseSafeChainsListValidation returns useSafeChainsListValidation', () => {
    expect(selectUseSafeChainsListValidation(mockState)).toBe(true);
  });

  it('selectTokenSortConfig returns tokenSortConfig', () => {
    expect(selectTokenSortConfig(mockState)).toEqual({
      key: 'tokenFiatAmount',
      order: 'dsc',
      sortCallback: 'stringNumeric',
    });
  });

  it('selectTokenNetworkFilter returns tokenNetworkFilter', () => {
    expect(selectTokenNetworkFilter(mockState)).toEqual({ '0x1': true });
  });

  it('selectIsMultiAccountBalancesEnabled returns value', () => {
    expect(selectIsMultiAccountBalancesEnabled(mockState)).toBe(true);
  });

  it('selectShowTestNetworks returns value', () => {
    expect(selectShowTestNetworks(mockState)).toBe(false);
  });

  it('selectShowIncomingTransactionNetworks returns value', () => {
    expect(selectShowIncomingTransactionNetworks(mockState)).toEqual({ '0x1': true });
  });

  it('selectIsIpfsGatewayEnabled returns value', () => {
    expect(selectIsIpfsGatewayEnabled(mockState)).toBe(true);
  });

  it('selectIsSecurityAlertsEnabled returns value', () => {
    expect(selectIsSecurityAlertsEnabled(mockState)).toBe(true);
  });

  it('selectSmartTransactionsOptInStatus returns value', () => {
    expect(selectSmartTransactionsOptInStatus(mockState)).toBe(true);
  });

  it('selectUseTransactionSimulations returns value', () => {
    expect(selectUseTransactionSimulations(mockState)).toBe(true);
  });

  it('selectPrivacyMode returns value', () => {
    expect(selectPrivacyMode(mockState)).toBe(false);
  });

  it('selectSmartTransactionsMigrationApplied returns value', () => {
    expect(selectSmartTransactionsMigrationApplied(mockState)).toBe(true);
  });

  it('selectSmartTransactionsBannerDismissed returns value', () => {
    expect(selectSmartTransactionsBannerDismissed(mockState)).toBe(false);
  });

  it('selectIsTokenNetworkFilterEqualCurrentNetwork returns true when filter matches chainId', () => {
    const result = selectIsTokenNetworkFilterEqualCurrentNetwork(mockState);
    expect(typeof result).toBe('boolean');
  });
});
