import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import renderWithProvider from '../../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../../util/test/initial-root-state';
import RevealPrivateKey from './RevealPrivateKey';
import Routes from '../../../../../../constants/navigation/Routes';
import { SecurityPrivacyViewSelectorsIDs } from '../../../../../../../e2e/selectors/Settings/SecurityAndPrivacy/SecurityPrivacyView.selectors';
import { REVEAL_PRIVATE_KEY_SECTION } from '../../SecuritySettings.constants';

const mockTrackEvent = jest.fn();
const mockCreateEventBuilder = jest.fn(() => ({
  addProperties: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnValue({}),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: jest.fn(),
  };
});

jest.mock('../../../../../../components/hooks/useMetrics', () => ({
  useMetrics: () => ({
    trackEvent: mockTrackEvent,
    createEventBuilder: mockCreateEventBuilder,
  }),
  MetaMetricsEvents: {
    REVEAL_PRIVATE_KEY_INITIATED: 'REVEAL_PRIVATE_KEY_INITIATED',
  },
}));

const initialState = { engine: { backgroundState } };

describe('RevealPrivateKey', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate });
  });

  it('renders correctly', () => {
    const { toJSON, getByTestId } = renderWithProvider(<RevealPrivateKey />, {
      state: initialState,
    });
    expect(getByTestId(REVEAL_PRIVATE_KEY_SECTION)).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('navigates to the reveal private credential screen and tracks the event', () => {
    const { getByTestId } = renderWithProvider(<RevealPrivateKey />, {
      state: initialState,
    });

    fireEvent.press(
      getByTestId(SecurityPrivacyViewSelectorsIDs.SHOW_PRIVATE_KEY),
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      Routes.SETTINGS.REVEAL_PRIVATE_CREDENTIAL,
      expect.objectContaining({
        credentialName: 'private_key',
        shouldUpdateNav: true,
      }),
    );
    expect(mockTrackEvent).toHaveBeenCalled();
  });
});
