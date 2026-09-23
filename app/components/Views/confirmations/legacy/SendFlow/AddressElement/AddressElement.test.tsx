import React from 'react';
import renderWithProvider from '../../../../../../util/test/renderWithProvider';

import AddressElement from '.';
import { renderShortAddress } from '../../../../../../util/address';
import { backgroundState } from '../../../../../../util/test/initial-root-state';
import { mockNetworkState } from '../../../../../../util/test/network';
import { CHAIN_IDS } from '@metamask/transaction-controller';

jest.unmock('react-redux');

const mockedNetworkControllerState = mockNetworkState({
  chainId: CHAIN_IDS.MAINNET,
  id: 'mainnet',
  nickname: 'Ethereum Mainnet',
  ticker: 'ETH',
});

jest.mock('../../../../../../core/Engine', () => {
  const { MOCK_ACCOUNTS_CONTROLLER_STATE } = jest.requireActual(
    '../../../../../../util/test/accountsControllerTestUtils',
  );
  return {
    context: {
      NetworkController: {
        getProviderAndBlockTracker: jest.fn().mockImplementation(() => ({
          provider: {
            sendAsync: () => null,
          },
        })),
        getNetworkClientById: () => ({
          configuration: {
            chainId: '0x1',
          },
        }),
        state: {
          ...mockedNetworkControllerState,
        },
      },
      KeyringController: {
        state: {
          keyrings: [],
        },
      },
      AccountsController: {
        ...MOCK_ACCOUNTS_CONTROLLER_STATE,
        state: MOCK_ACCOUNTS_CONTROLLER_STATE,
      },
    },
  };
});

const initialState = {
  engine: {
    backgroundState,
  },
};

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderComponent = (state: any) =>
  renderWithProvider(
    <AddressElement
      address={'0xd018538C87232FF95acbCe4870629b75640a78E7'}
      onAccountPress={() => null}
      onAccountLongPress={() => null}
      onIconPress={() => null}
      testID="address-element"
      chainId="0x1"
    />,
    { state },
  );

describe('AddressElement', () => {
  it('should render correctly', () => {
    const { toJSON } = renderComponent(initialState);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should render the address', () => {
    const address = '0xd018538C87232FF95acbCe4870629b75640a78E7';
    const { getByText } = renderComponent(initialState);
    const addressText = getByText(renderShortAddress(address));
    expect(addressText).toBeDefined();
  });

  it('should be memoized', () => {
    expect((AddressElement as unknown as { $$typeof: symbol }).$$typeof).toBe(
      Symbol.for('react.memo'),
    );
  });

  it('should re-render when its props change', () => {
    const address = '0xd018538C87232FF95acbCe4870629b75640a78E7';
    const otherAddress = '0x2990079bcdEe240329a520d2444386FC119da21a';
    const { getByText, queryByText, rerender } = renderWithProvider(
      <AddressElement
        address={address}
        onAccountPress={() => null}
        onAccountLongPress={() => null}
        onIconPress={() => null}
        testID="address-element"
        chainId="0x1"
      />,
      { state: initialState },
    );
    expect(getByText(renderShortAddress(address))).toBeDefined();

    rerender(
      <AddressElement
        address={otherAddress}
        onAccountPress={() => null}
        onAccountLongPress={() => null}
        onIconPress={() => null}
        testID="address-element"
        chainId="0x1"
      />,
    );

    expect(getByText(renderShortAddress(otherAddress))).toBeDefined();
    expect(queryByText(renderShortAddress(address))).toBeNull();
  });
});
