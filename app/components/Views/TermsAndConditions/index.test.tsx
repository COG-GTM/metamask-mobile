import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import TermsAndConditions from './';

describe('TermsAndConditions', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <TermsAndConditions
        {...({ action: 'import' } as unknown as React.ComponentProps<
          typeof TermsAndConditions
        >)}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
