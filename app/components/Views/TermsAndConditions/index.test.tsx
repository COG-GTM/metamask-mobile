import React from 'react';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import TermsAndConditions from './';

describe('TermsAndConditions', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <TermsAndConditions
        navigation={{} as unknown as NavigationProp<ParamListBase>}
        action="import"
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
