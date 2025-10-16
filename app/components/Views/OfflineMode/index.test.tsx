import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import OfflineMode from './';

describe('OfflineMode', () => {
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

    const { toJSON } = renderWithProvider(<OfflineMode navigation={mockNavigation as never} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
