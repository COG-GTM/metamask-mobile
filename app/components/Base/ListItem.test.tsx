// Third party dependencies.
import React from 'react';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import ListItem from './ListItem';

describe('ListItem', () => {
  it('renders all compound subcomponents', () => {
    const { toJSON, getByText } = render(
      <ListItem>
        <ListItem.Date>2024-01-01</ListItem.Date>
        <ListItem.Content>
          <ListItem.Icon>
            {null}
          </ListItem.Icon>
          <ListItem.Body>
            <ListItem.Title>My title</ListItem.Title>
          </ListItem.Body>
          <ListItem.Amounts>
            <ListItem.Amount>1 ETH</ListItem.Amount>
            <ListItem.FiatAmount>$1,000</ListItem.FiatAmount>
          </ListItem.Amounts>
        </ListItem.Content>
        <ListItem.Actions>
          <ListItem.Title>Action</ListItem.Title>
        </ListItem.Actions>
      </ListItem>,
    );

    expect(getByText('2024-01-01')).toBeTruthy();
    expect(getByText('My title')).toBeTruthy();
    expect(getByText('1 ETH')).toBeTruthy();
    expect(getByText('$1,000')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
