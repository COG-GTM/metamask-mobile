import React from 'react';
import { render } from '@testing-library/react-native';
import AnimatedQRCode from './AnimatedQRCode';

jest.mock('react-native-qrcode-svg', () => 'QRCode');
jest.mock('../../../util/theme', () => ({
  useTheme: () => ({
    colors: {
      background: { default: '#FFFFFF' },
    },
    brandColors: { white: '#FFFFFF' },
  }),
}));

jest.mock('@ngraveio/bc-ur', () => ({
  UR: jest.fn().mockImplementation(() => ({})),
  UREncoder: jest.fn().mockImplementation(() => ({
    nextPart: jest.fn().mockReturnValue('ur:test-part'),
  })),
}));

describe('AnimatedQRCode', () => {
  const defaultProps = {
    cbor: 'a101',
    type: 'crypto-psbt',
    shouldPause: false,
  };

  it('renders correctly', () => {
    const { toJSON } = render(<AnimatedQRCode {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders when paused', () => {
    const { toJSON } = render(
      <AnimatedQRCode {...defaultProps} shouldPause />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<AnimatedQRCode {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
