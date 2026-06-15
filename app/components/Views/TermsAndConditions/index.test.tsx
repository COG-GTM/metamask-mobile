import React from 'react';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import TermsAndConditions from './';

describe('TermsAndConditions', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <TermsAndConditions
        navigation={{} as NavigationProp<ParamListBase>}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
