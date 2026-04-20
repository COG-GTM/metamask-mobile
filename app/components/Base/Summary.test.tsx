// Third party dependencies.
import React from 'react';
import { Text as RNText } from 'react-native';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import Summary from './Summary';

describe('Summary', () => {
  it('renders all compound subcomponents', () => {
    const { toJSON, getByText } = render(
      <Summary>
        <Summary.Row>
          <Summary.Col>
            <RNText>Row value</RNText>
          </Summary.Col>
          <Summary.Col end>
            <RNText>Right</RNText>
          </Summary.Col>
        </Summary.Row>
        <Summary.Separator />
        <Summary.Row end last>
          <RNText>Last</RNText>
        </Summary.Row>
      </Summary>,
    );

    expect(getByText('Row value')).toBeTruthy();
    expect(getByText('Last')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
