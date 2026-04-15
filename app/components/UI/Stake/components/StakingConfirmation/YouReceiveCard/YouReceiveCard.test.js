import React from 'react';
import renderWithProvider from '../../../../../../util/test/renderWithProvider';
import YouReceiveCard from './YouReceiveCard';

import { renderFromWei } from '../../../../../../util/number';
import { strings } from '../../../../../../../locales/i18n';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualReactNavigation = jest.requireActual('@react-navigation/native');
  return {
    ...actualReactNavigation,
    useNavigation: () => ({
      navigate: mockNavigate
    })
  };
});

describe('YouReceiveCard', () => {
  it('render matches snapshot', () => {
    const props = {
      amountWei: '4999820000000000000',
      amountFiat: '12,881.64'
    };

    const { toJSON, getByText } = renderWithProvider(
      <YouReceiveCard {...props} />
    );

    expect(getByText(strings('stake.estimated_changes'))).toBeDefined();
    expect(getByText(strings('stake.you_receive'))).toBeDefined();
    expect(getByText(`+ ${renderFromWei(props.amountWei)}`)).toBeDefined();
    expect(getByText(`$${props.amountFiat}`)).toBeDefined();

    expect(toJSON()).toMatchSnapshot();
  });
});