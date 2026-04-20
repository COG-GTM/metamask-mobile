// Third party dependencies.
import React from 'react';
import { Text as RNText } from 'react-native';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import SelectValueBase from './SelectValueBase';

describe('SelectValueBase', () => {
  it('renders children', () => {
    const { getByText } = render(
      <SelectValueBase>
        <RNText>selected value</RNText>
      </SelectValueBase>,
    );
    expect(getByText('selected value')).toBeTruthy();
  });

  it('renders start and end accessories when provided', () => {
    const { getByText } = render(
      <SelectValueBase
        startAccessory={<RNText>start</RNText>}
        endAccessory={<RNText>end</RNText>}
      >
        <RNText>middle</RNText>
      </SelectValueBase>,
    );
    expect(getByText('start')).toBeTruthy();
    expect(getByText('middle')).toBeTruthy();
    expect(getByText('end')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <SelectValueBase>
        <RNText>child</RNText>
      </SelectValueBase>,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
