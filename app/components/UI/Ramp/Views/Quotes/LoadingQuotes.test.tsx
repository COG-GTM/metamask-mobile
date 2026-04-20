import React from 'react';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import LoadingQuotes from './LoadingQuotes';

describe('LoadingQuotes', () => {
  it('renders the default placeholder when count is omitted', () => {
    const { toJSON } = renderWithProvider(<LoadingQuotes />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the number of rows specified by count', () => {
    const { toJSON } = renderWithProvider(<LoadingQuotes count={5} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
