import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import { render, waitFor } from '@testing-library/react-native';

import SendFlowAddressFrom from '.';
import { backgroundState } from '../../../../../../util/test/initial-root-state';
import { doENSReverseLookup } from '../../../../../../util/ENSUtils';

jest.mock('../../../../../../util/ENSUtils', () => ({
  ...jest.requireActual('../../../../../../util/ENSUtils'),
  doENSReverseLookup: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigation: {},
  }),
  createNavigatorFactory: () => ({}),
}));

jest.mock('../../../../../../core/Engine', () => ({
  context: {
    KeyringController: {
      state: {
        keyrings: [
          {
            accounts: ['0xd018538C87232FF95acbCe4870629b75640a78E7'],
          },
        ],
      },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockInitialState: any = {
  settings: {},
  transaction: {
    selectedAsset: {
      address: '0xd018538C87232FF95acbCe4870629b75640a78E7',
      decimals: 18,
      symbol: 'ETH',
    },
  },
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountTrackerController: {
        accountsByChainId: {
          '0x1': {
            '0xd018538C87232FF95acbCe4870629b75640a78E7': {
              balance: '0x0',
            },
          },
        },
      },
      AccountsController: {
        internalAccounts: {
          accounts: {
            '30313233-3435-4637-b839-383736353430': {
              // Lower case address to test edge case
              address: '0xd018538c87232ff95acbce4870629b75640a78e7',
              id: '30313233-3435-4637-b839-383736353430',
              options: {},
              metadata: {
                name: 'Account 1',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              methods: [
                'personal_sign',
                'eth_signTransaction',
                'eth_signTypedData_v1',
                'eth_signTypedData_v3',
                'eth_signTypedData_v4',
              ],
              type: 'eip155:eoa',
            },
          },
          selectedAccount: '30313233-3435-4637-b839-383736353430',
        },
      },
      KeyringController: {
        state: {
          keyrings: [],
        },
      },
    },
  },
};

let mockState = mockInitialState;

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn().mockImplementation((callback) => callback(mockState)),
}));

const mockDoENSReverseLookup = doENSReverseLookup as jest.Mock;
const mockStore = configureMockStore();
const store = mockStore(mockInitialState);

describe('SendFlowAddressFrom', () => {
  it('should render correctly', () => {
    const wrapper = render(
      <Provider store={store}>
        <SendFlowAddressFrom
          fromAccountBalanceState={jest.fn}
          setFromAddress={jest.fn}
          chainId="0x1"
        />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('does not repeat the ENS lookup when only the balance changes', async () => {
    mockDoENSReverseLookup.mockReset();
    mockDoENSReverseLookup.mockResolvedValue('account.eth');
    const address = '0xd018538C87232FF95acbCe4870629b75640a78E7';
    const setBalance = (balance: string) => {
      // New state references, as AccountTrackerController updates produce.
      mockState = {
        ...mockInitialState,
        engine: {
          backgroundState: {
            ...mockInitialState.engine.backgroundState,
            AccountTrackerController: {
              accountsByChainId: { '0x1': { [address]: { balance } } },
            },
          },
        },
      };
    };
    const fromAccountBalanceState = jest.fn();
    const renderComponent = () => (
      <Provider store={store}>
        <SendFlowAddressFrom
          fromAccountBalanceState={fromAccountBalanceState}
          setFromAddress={jest.fn()}
          chainId="0x1"
        />
      </Provider>
    );

    try {
      const { rerender, getByText } = render(renderComponent());
      await waitFor(() => expect(getByText('account.eth')).toBeTruthy());

      setBalance('0xde0b6b3a7640000');
      rerender(renderComponent());
      await waitFor(() =>
        expect(fromAccountBalanceState).toHaveBeenLastCalledWith(false),
      );

      setBalance('0x1bc16d674ec80000');
      rerender(renderComponent());
      await waitFor(() => expect(getByText(/\s2 ETH$/)).toBeTruthy());

      expect(getByText('account.eth')).toBeTruthy();
      expect(mockDoENSReverseLookup).toHaveBeenCalledTimes(1);
      expect(mockDoENSReverseLookup).toHaveBeenCalledWith(address, '0x1');
    } finally {
      mockState = mockInitialState;
    }
  });
});
