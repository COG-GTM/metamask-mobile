import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import GlobalAlert from './';

describe('GlobalAlert', () => {
  it('should render correctly', () => {
    const Component = GlobalAlert as unknown as React.ComponentType;
    const { toJSON } = renderWithProvider(<Component />);
    expect(toJSON()).toMatchSnapshot();
  });
});
