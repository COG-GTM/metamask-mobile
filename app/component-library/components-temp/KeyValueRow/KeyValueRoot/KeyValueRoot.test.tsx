// Third party dependencies.
import React from 'react';
import { Text as RNText } from 'react-native';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import KeyValueRowRoot from './KeyValueRoot';

describe('KeyValueRowRoot', () => {
  it('renders its children', () => {
    const { getByText } = render(
      <KeyValueRowRoot>
        <RNText>a</RNText>
        <RNText>b</RNText>
      </KeyValueRowRoot>,
    );
    expect(getByText('a')).toBeTruthy();
    expect(getByText('b')).toBeTruthy();
  });

  it('applies custom style alongside default root style', () => {
    const { toJSON } = render(
      <KeyValueRowRoot style={{ padding: 5 }}>
        <RNText>child</RNText>
      </KeyValueRowRoot>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
