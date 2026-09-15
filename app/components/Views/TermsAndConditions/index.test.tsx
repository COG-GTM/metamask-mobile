import React, { ComponentType } from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import TermsAndConditionsComponent from './';

const TermsAndConditions =
  TermsAndConditionsComponent as unknown as ComponentType<{
    action: string;
  }>;

describe('TermsAndConditions', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <TermsAndConditions action="import" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
