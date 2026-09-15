import React, { ComponentType } from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import TermsAndConditions from './';

const TermsAndConditionsScreen =
  TermsAndConditions as unknown as ComponentType<{
    action: string;
  }>;

describe('TermsAndConditions', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <TermsAndConditionsScreen action="import" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
