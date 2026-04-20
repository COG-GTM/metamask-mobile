// Third party dependencies.
import React from 'react';
import { Text as RNText } from 'react-native';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import ScreenView from './ScreenView';

describe('ScreenView', () => {
  it('renders its children inside a ScrollView and SafeAreaView', () => {
    const { getByText, toJSON } = render(
      <ScreenView>
        <RNText>content</RNText>
      </ScreenView>,
    );
    expect(getByText('content')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
