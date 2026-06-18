/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-shadow, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars, import/no-commonjs, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import React from 'react';
import { shallow } from 'enzyme';
import TokenImage from './';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../util/test/initial-root-state';

const mockStore = configureMockStore();
const initialState = {
  engine: {
    backgroundState,
  },
  settings: {
    primaryCurrency: 'usd',
  },
};
const store = mockStore(initialState);

describe('TokenImage', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <TokenImage
          asset={{
            address: '0x123',
            symbol: 'ABC',
            decimals: 18,
            image: 'invalid-uri',
          } as any}
        />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
