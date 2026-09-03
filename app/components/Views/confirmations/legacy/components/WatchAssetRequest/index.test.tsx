import React from 'react';
import { shallow } from 'enzyme';
import WatchAssetRequest from '.';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../../../../util/test/initial-root-state';

const mockStore = configureMockStore();
const initialState = {
  engine: {
    backgroundState,
  },
};
const store = mockStore(initialState);
const WatchAssetRequestForTest = WatchAssetRequest as unknown as React.ComponentType<{
  suggestedAssetMeta: {
    asset: { address: string; symbol: string; decimals: number };
  };
}>;

describe('WatchAssetRequest', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <WatchAssetRequestForTest
          suggestedAssetMeta={{
            asset: { address: '0x2', symbol: 'TKN', decimals: 0 },
          } as unknown as React.ComponentProps<typeof WatchAssetRequest>['suggestedAssetMeta']}
        />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
