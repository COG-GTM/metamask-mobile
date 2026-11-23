import React from 'react';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../util/test/initial-root-state';
import { TokenList } from '.';
import useEarnTokens from '../../Earn/hooks/useEarnTokens';

const selectedAddress = '0x123';

jest.mock('../../Earn/hooks/useEarnTokens', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../Earn/selectors/featureFlags', () => ({
  selectPooledStakingEnabledFlag: jest.fn(() => true),
  selectStablecoinLendingEnabledFlag: jest.fn(() => true),
}));

jest.mock('../../Stake/components/StakeButton', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { Text } = jest.requireActual('react-native');
  return {
    StakeButton: ({ asset }: { asset: { symbol: string } }) => (
      <Text>{`earn-cta-${asset.symbol}`}</Text>
    ),
  };
});

jest.mock('../../Stake/hooks/useStakingChain', () => ({
  __esModule: true,
  default: jest.fn(() => ({ isStakingSupportedChain: true })),
  useStakingChainByChainId: jest.fn(() => ({ isStakingSupportedChain: true })),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), push: jest.fn() }),
}));

const mockUseEarnTokens = useEarnTokens as jest.MockedFunction<
  typeof useEarnTokens
>;

const tokens = [
  { symbol: 'USDC', address: '0x01', decimals: 6 },
  { symbol: 'DAI', address: '0x02', decimals: 18 },
  { symbol: 'LINK', address: '0x03', decimals: 18 },
];

const state = {
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: {
        internalAccounts: {
          selectedAccount: '1',
          accounts: { '1': { id: '1', address: selectedAddress } },
        },
      },
      NetworkController: {
        ...backgroundState.NetworkController,
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            name: 'Ethereum Mainnet',
            nativeCurrency: 'ETH',
            rpcEndpoints: [{ networkClientId: 'mainnet' }],
            defaultRpcEndpointIndex: 0,
          },
        },
      },
      TokensController: {
        allTokens: { '0x1': { [selectedAddress]: tokens } },
        allIgnoredTokens: {},
        allDetectedTokens: {},
      },
      TokenBalancesController: {
        tokenBalances: {
          [selectedAddress]: {
            '0x1': { '0x01': '0x64', '0x02': '0x64', '0x03': '0x64' },
          },
        },
      },
    },
  },
  settings: { primaryCurrency: 'usd' },
};

const tokenKeys = tokens.map(({ address }) => ({
  address,
  chainId: '0x1',
  isStaked: false,
}));

const renderTokenList = () =>
  renderWithProvider(
    <TokenList
      tokenKeys={tokenKeys}
      refreshing={false}
      isAddTokenEnabled
      onRefresh={jest.fn()}
      showRemoveMenu={jest.fn()}
      goToAddToken={jest.fn()}
      setShowScamWarningModal={jest.fn()}
    />,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { state: state as any },
  );

describe('TokenList earn CTA', () => {
  beforeEach(() => {
    mockUseEarnTokens.mockReset();
    mockUseEarnTokens.mockReturnValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { symbol: 'USDC', chainId: '0x1', address: '0x01' } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { symbol: 'DAI', chainId: '0x5', address: '0x02' } as any,
    ]);
  });

  it('derives earn tokens once for the list instead of once per row', () => {
    const { getByText } = renderTokenList();

    expect(getByText('LINK')).toBeOnTheScreen();
    expect(mockUseEarnTokens).toHaveBeenCalledTimes(1);
  });

  it('shows the CTA only for rows whose chainId and symbol are earn tokens', () => {
    const { getByText, queryByText } = renderTokenList();

    expect(getByText('earn-cta-USDC')).toBeOnTheScreen();
    // DAI is an earn token on another chain, LINK is not an earn token.
    expect(queryByText('earn-cta-DAI')).toBeNull();
    expect(queryByText('earn-cta-LINK')).toBeNull();
  });
});
