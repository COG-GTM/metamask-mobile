import React from 'react';
import { render } from '@testing-library/react-native';
import NetworkField from './NetworkField';
import { ModalFieldType } from '../../../../../util/notifications';

describe('NetworkField', () => {
  const baseProps = {
    type: ModalFieldType.NETWORK as const,
    iconUrl: 'https://example.com/eth.png',
    name: 'Ethereum',
  };

  it('renders correctly when iconUrl is provided', () => {
    const { toJSON } = render(<NetworkField {...baseProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the network name passed via props', () => {
    const { getByText } = render(<NetworkField {...baseProps} />);
    expect(getByText('Ethereum')).toBeDefined();
  });

  it('returns null when iconUrl is missing', () => {
    const { toJSON } = render(
      <NetworkField type={ModalFieldType.NETWORK} name="Ethereum" />,
    );
    expect(toJSON()).toBeNull();
  });

  it('accepts an ImageSourcePropType icon (non-string)', () => {
    const { toJSON } = render(
      <NetworkField
        type={ModalFieldType.NETWORK}
        iconUrl={{ uri: 'https://example.com/img.png' }}
        name="Polygon"
      />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
