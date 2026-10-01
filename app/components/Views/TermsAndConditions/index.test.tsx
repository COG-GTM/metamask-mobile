import React from 'react';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import TermsAndConditions from './';

describe('TermsAndConditions', () => {
  it('should render correctly', () => {
    const navigation = {
      navigate: jest.fn(),
    } as unknown as NavigationProp<ParamListBase>;
    const { toJSON } = renderWithProvider(
      <TermsAndConditions navigation={navigation} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
