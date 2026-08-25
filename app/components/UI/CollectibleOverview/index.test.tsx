import React from 'react';
import CollectibleOverviewComponent from './';
import configureMockStore from 'redux-mock-store';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../util/test/initial-root-state';

const CollectibleOverview =
  CollectibleOverviewComponent as unknown as React.FC<
    Partial<React.ComponentProps<typeof CollectibleOverviewComponent>>
  >;

const mockStore = configureMockStore();
const initialState = {
  collectibles: {
    favorites: {},
  },
  engine: {
    backgroundState,
  },
};
const store = mockStore(initialState);

describe('CollectibleOverview', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <CollectibleOverview
          collectible={{
            name: 'Leopard',
            tokenId: 6904,
            address: '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d',
            externalLink: 'https://nft.example.com',
            tradable: true,
          }}
        />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
