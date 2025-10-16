import React from 'react';
import { shallow } from 'enzyme';
import SimpleWebview from './';

describe('SimpleWebview', () => {
  it('should render correctly', () => {
    const mockNavigation = {
      goBack: jest.fn(),
      navigate: jest.fn(),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
      setParams: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      canGoBack: jest.fn(() => true),
      getId: jest.fn(),
      getParent: jest.fn(),
      getState: jest.fn(),
      isFocused: jest.fn(() => true),
      reset: jest.fn(),
    };

    const mockRoute = {
      key: 'test-key',
      name: 'SimpleWebview',
      params: { url: 'https://etherscan.io' },
    };

    const wrapper = shallow(
      <SimpleWebview
        navigation={mockNavigation as never}
        route={mockRoute as never}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
