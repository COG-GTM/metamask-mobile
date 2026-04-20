/* eslint-disable react/jsx-pascal-case, react/prop-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-require-imports, import/no-commonjs */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn() }),
  };
});

jest.mock('react-native-modal', () => {
  const RN = jest.requireActual('react-native');
  const MockModal = ({ isVisible, children }) =>
    isVisible ? <RN.View testID="modal">{children}</RN.View> : null;
  return { __esModule: true, default: MockModal };
});

jest.mock('../utils/useBlockExplorer', () =>
  jest.fn(() => ({
    name: 'Etherscan',
    isValid: true,
    token: (address) => `https://etherscan.io/token/${address}`,
  })),
);

jest.mock('../utils/useFetchTokenMetadata', () =>
  jest.fn(() => [false, { valid: null, error: false, metadata: null }]),
);

jest.mock('./TokenIcon', () => {
  const RN = jest.requireActual('react-native');
  return { __esModule: true, default: () => <RN.View testID="token-icon" /> };
});

jest.mock('./TokenImportModal', () => {
  const RN = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ isVisible }) =>
      isVisible ? <RN.View testID="import-modal" /> : null,
  };
});

jest.mock('../../../../components/hooks/useMetrics', () => ({
  useMetrics: () => ({
    trackEvent: jest.fn(),
    createEventBuilder: jest.fn(() => ({
      addSensitiveProperties: () => ({ build: () => ({}) }),
    })),
  }),
}));

import TokenSelectModal from './TokenSelectModal';

const mockStore = configureMockStore();
const buildStore = () =>
  mockStore({
    settings: { showFiatOnTestnets: false },
    engine: {
      backgroundState: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              nativeCurrency: 'ETH',
              rpcEndpoints: [
                { networkClientId: 'mainnet', type: 'infura', url: 'https://x' },
              ],
              defaultRpcEndpointIndex: 0,
            },
          },
        },
        CurrencyRateController: {
          currentCurrency: 'usd',
          currencyRates: { ETH: { conversionRate: 2000 } },
        },
        TokenRatesController: { marketData: {} },
        AccountTrackerController: { accountsByChainId: { '0x1': {} } },
        TokenBalancesController: { tokenBalances: {} },
        AccountsController: {
          internalAccounts: {
            selectedAccount: 'acc-1',
            accounts: {
              'acc-1': {
                id: 'acc-1',
                address: '0x1111111111111111111111111111111111111111',
                metadata: { name: 'Account 1', keyring: { type: 'HD Key Tree' } },
                options: {},
                methods: [],
                type: 'eip155:eoa',
              },
            },
          },
        },
        PreferencesController: {},
      },
    },
  });

const wrap = (ui) => <Provider store={buildStore()}>{ui}</Provider>;

const defaultProps = {
  isVisible: true,
  dismiss: jest.fn(),
  title: 'Select a token',
  tokens: [
    { address: '0xaaa', symbol: 'AAA', name: 'Alpha', decimals: 18 },
    { address: '0xbbb', symbol: 'BBB', name: 'Beta', decimals: 18 },
  ],
  initialTokens: [],
  onItemPress: jest.fn(),
  excludeAddresses: [],
};

describe('TokenSelectModal', () => {
  it('matches the snapshot when visible', () => {
    const { toJSON } = render(wrap(<TokenSelectModal {...defaultProps} />));
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the token list when visible', () => {
    const { getByText } = render(wrap(<TokenSelectModal {...defaultProps} />));
    expect(getByText('AAA')).toBeTruthy();
    expect(getByText('BBB')).toBeTruthy();
  });

  it('calls onItemPress when a token is pressed', () => {
    const onItemPress = jest.fn();
    const { getByText } = render(
      wrap(<TokenSelectModal {...defaultProps} onItemPress={onItemPress} />),
    );
    fireEvent.press(getByText('AAA'));
    expect(onItemPress).toHaveBeenCalled();
  });

  it('excludes addresses provided via excludeAddresses', () => {
    const { queryByText } = render(
      wrap(
        <TokenSelectModal {...defaultProps} excludeAddresses={['0xaaa']} />,
      ),
    );
    expect(queryByText('AAA')).toBeNull();
  });

  it('does not render when not visible', () => {
    const { queryByTestId } = render(
      wrap(<TokenSelectModal {...defaultProps} isVisible={false} />),
    );
    expect(queryByTestId('modal')).toBeNull();
  });
});
