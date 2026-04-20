import React from 'react';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import SelectHardwareWallet from './index';
import { backgroundState } from '../../../../util/test/initial-root-state';

const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      setOptions: mockSetOptions,
    }),
  };
});

jest.mock('../../../../components/hooks/useMetrics', () => ({
  useMetrics: () => ({
    trackEvent: jest.fn(),
    createEventBuilder: jest.fn(() => ({
      addProperties: jest.fn().mockReturnThis(),
      build: jest.fn(),
    })),
  }),
}));

jest.mock('../../../UI/Navbar', () => ({
  getNavigationOptionsTitle: jest.fn(() => ({})),
}));

const initialState = {
  engine: {
    backgroundState,
  },
};

describe('SelectHardwareWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { toJSON } = renderWithProvider(<SelectHardwareWallet />, {
      state: initialState,
    });
    expect(toJSON()).toBeTruthy();
  });

  it('renders select hardware text', () => {
    const { getByText } = renderWithProvider(<SelectHardwareWallet />, {
      state: initialState,
    });
    expect(getByText('Select a hardware wallet')).toBeDefined();
  });
});
