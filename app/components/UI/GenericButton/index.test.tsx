import React from 'react';
import GenericButtonIos from './index.ios';
import GenericButtonAndroid from './index.android';

import { render } from '@testing-library/react-native';
describe('GenericButton', () => {
  it('should render correctly on iOS', () => {
    const { toJSON } = render(<GenericButtonIos />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should render correctly on android', () => {
    jest.doMock('react-native/Libraries/Utilities/Platform', () => ({
      OS: 'android',
    }));
    const { toJSON } = render(<GenericButtonAndroid />);
    expect(toJSON()).toMatchSnapshot();
  });
});
