import React from 'react';
import { render } from '@testing-library/react-native';
import DeprecatedNetworkModal from './DeprecatedNetworkModal';

jest.mock('../../../component-library/hooks', () => ({
  useStyles: () => ({
    styles: {
      centeredTitle: {},
      centeredDescription: {},
      footer: {},
      button: {},
      buttonLabel: {},
    },
  }),
}));

jest.mock('../../../components/hooks/useMetrics', () => ({
  useMetrics: () => ({
    trackEvent: jest.fn(),
    createEventBuilder: jest.fn(() => ({
      addProperties: jest.fn().mockReturnThis(),
      build: jest.fn(),
    })),
  }),
}));

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

jest.mock('../../../component-library/components/BottomSheets/BottomSheet', () => {
  const { forwardRef } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: forwardRef(({ children }: { children: React.ReactNode }, _ref: React.Ref<unknown>) => (
      <View>{children}</View>
    )),
  };
});

describe('DeprecatedNetworkModal', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<DeprecatedNetworkModal />);
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<DeprecatedNetworkModal />);
    expect(toJSON()).toMatchSnapshot();
  });
});
