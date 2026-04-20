import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import AddressCopy from './AddressCopy';
import { backgroundState } from '../../../util/test/initial-root-state';

jest.mock('../../../core/ClipboardManager', () => ({
  setString: jest.fn(),
}));

jest.mock('../../../components/hooks/useMetrics', () => ({
  useMetrics: () => ({
    trackEvent: jest.fn(),
    createEventBuilder: jest.fn(() => ({
      addProperties: jest.fn().mockReturnThis(),
      build: jest.fn(),
    })),
  }),
}));

jest.mock('../../../component-library/hooks', () => ({
  useStyles: () => ({
    styles: {
      address: {},
      copyButton: {},
    },
  }),
}));

jest.mock('react-native-gesture-handler', () => {
  const { TouchableOpacity } = jest.requireActual('react-native');
  return { TouchableOpacity };
});

const mockStore = configureMockStore();

const initialState = {
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: {
        internalAccounts: {
          selectedAccount: 'account1',
          accounts: {
            account1: {
              address: '0x1234567890abcdef1234567890abcdef12345678',
              id: 'account1',
              metadata: { name: 'Account 1', keyring: { type: 'HD Key Tree' } },
              options: {},
              methods: [],
              type: 'eip155:eoa',
            },
          },
        },
      },
    },
  },
};

describe('AddressCopy', () => {
  it('renders correctly', () => {
    const store = mockStore(initialState);
    const { toJSON } = render(
      <Provider store={store}>
        <AddressCopy />
      </Provider>,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const store = mockStore(initialState);
    const { toJSON } = render(
      <Provider store={store}>
        <AddressCopy />
      </Provider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
