import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import AddressQRCode from './index';
import { backgroundState } from '../../../util/test/initial-root-state';

jest.mock('react-native-qrcode-svg', () => 'QRCode');
jest.mock('react-native-vector-icons/Ionicons', () => 'IonicIcon');
jest.mock('../../../core/ClipboardManager', () => ({
  setString: jest.fn(),
}));
jest.mock('../../UI/GlobalAlert', () => 'GlobalAlert');

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
  user: {
    seedphraseBackedUp: true,
  },
};

describe('AddressQRCode', () => {
  it('renders correctly', () => {
    const store = mockStore(initialState);
    const closeQrModal = jest.fn();
    const { toJSON } = render(
      <Provider store={store}>
        <AddressQRCode closeQrModal={closeQrModal} />
      </Provider>,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const store = mockStore(initialState);
    const closeQrModal = jest.fn();
    const { toJSON } = render(
      <Provider store={store}>
        <AddressQRCode closeQrModal={closeQrModal} />
      </Provider>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
