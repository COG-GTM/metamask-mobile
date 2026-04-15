import React from 'react';
import {

  renderScreen } from
'../../../util/test/renderWithProvider';
import AccountRightButton from './';
import { backgroundState } from '../../../util/test/initial-root-state';

import { mockNetworkState } from '../../../util/test/network';
import { CHAIN_IDS } from '@metamask/transaction-controller';

const mockInitialState = {
  settings: {},
  engine: {
    backgroundState: {
      ...backgroundState,
      NetworkController: {
        ...mockNetworkState({
          id: 'mainnet',
          nickname: 'Ethereum Mainnet',
          ticker: 'ETH',
          chainId: CHAIN_IDS.MAINNET
        })
      },
      SelectedNetworkController: {
        domains: {}
      }
    }
  }
};

describe('AccountRightButton', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      () =>
      <AccountRightButton
        selectedAddress="0x123"
        onPress={() => undefined}
        isNetworkVisible />,


      {
        name: 'AccountRightButton'
      },
      { state: mockInitialState }
    );
    expect(toJSON()).toMatchSnapshot();
  });
});