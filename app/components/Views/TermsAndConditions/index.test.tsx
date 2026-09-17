import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import TermsAndConditions from './';

const TermsAndConditionsComponent =
  TermsAndConditions as unknown as React.ComponentType<
    Record<string, unknown>
  >;

describe('TermsAndConditions', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <TermsAndConditionsComponent action="import" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
