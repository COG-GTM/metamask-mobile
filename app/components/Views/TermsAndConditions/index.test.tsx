import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import TermsAndConditions from './';

describe('TermsAndConditions', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <TermsAndConditions navigation={{ navigate: jest.fn() }} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
