import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import TermsAndConditions from './';

describe('TermsAndConditions', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      // @ts-expect-error -- legacy JavaScript UI type boundary
      <TermsAndConditions action="import" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
