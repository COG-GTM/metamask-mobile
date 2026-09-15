import React, { ComponentProps, ComponentType } from 'react';
import TransactionReviewInformation from '.';
import configureMockStore from 'redux-mock-store';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../../../../../util/test/initial-root-state';

// The component is rendered shallowly, so only a subset of its props is needed.
const TransactionReviewInformationComponent =
  TransactionReviewInformation as unknown as ComponentType<
    Partial<ComponentProps<typeof TransactionReviewInformation>>
  >;

const mockStore = configureMockStore();
const initialState = {
  engine: {
    backgroundState,
  },
  transaction: {
    value: '',
    data: '',
    from: '0x1',
    gas: '',
    gasPrice: '',
    to: '0x2',
    selectedAsset: undefined,
    assetType: undefined,
  },
  settings: {
    primaryCurrency: 'ETH',
  },
  fiatOrders: {
    networks: [
      {
        active: true,
        chainId: 1,
        chainName: 'Ethereum Mainnet',
        nativeTokenSupported: true,
      },
    ],
  },
};
const store = mockStore(initialState);

describe('TransactionReviewInformation', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <TransactionReviewInformationComponent EIP1559GasData={{}} />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
