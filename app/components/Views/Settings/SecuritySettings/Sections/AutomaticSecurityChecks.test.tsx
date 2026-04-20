import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';
import AutomaticSecurityChecks from './AutomaticSecurityChecks';
import { setAutomaticSecurityChecks } from '../../../../../actions/security';

jest.mock('../../../../../actions/security', () => {
  const actual = jest.requireActual('../../../../../actions/security');
  return {
    ...actual,
    setAutomaticSecurityChecks: jest.fn((enabled: boolean) => ({
      type: 'SET_AUTOMATIC_SECURITY_CHECKS',
      enabled,
    })),
  };
});

const mockTrackEvent = jest.fn();
const mockCreateEventBuilder = jest.fn(() => ({
  addProperties: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnValue({}),
}));

jest.mock('../../../../../components/hooks/useMetrics', () => ({
  useMetrics: () => ({
    trackEvent: mockTrackEvent,
    createEventBuilder: mockCreateEventBuilder,
  }),
  MetaMetricsEvents: {
    AUTOMATIC_SECURITY_CHECKS_ENABLED_FROM_SETTINGS:
      'AUTOMATIC_SECURITY_CHECKS_ENABLED_FROM_SETTINGS',
    AUTOMATIC_SECURITY_CHECKS_DISABLED_FROM_SETTINGS:
      'AUTOMATIC_SECURITY_CHECKS_DISABLED_FROM_SETTINGS',
  },
}));

const buildState = (enabled: boolean) => ({
  engine: { backgroundState },
  security: { automaticSecurityChecksEnabled: enabled },
});

describe('AutomaticSecurityChecks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when disabled', () => {
    const { toJSON } = renderWithProvider(<AutomaticSecurityChecks />, {
      state: buildState(false),
    });
    expect(toJSON()).toMatchSnapshot();
  });

  it('invokes setAutomaticSecurityChecks when toggled', () => {
    (setAutomaticSecurityChecks as jest.Mock).mockClear();
    const { UNSAFE_root } = renderWithProvider(<AutomaticSecurityChecks />, {
      state: buildState(false),
    });

    const toggles = UNSAFE_root.findAllByProps({ value: false });
    const toggle = toggles.find(
      (node) => typeof node.props.onValueChange === 'function',
    );

    if (!toggle) {
      throw new Error('Toggle switch not found');
    }
    fireEvent(toggle, 'onValueChange', true);

    expect(setAutomaticSecurityChecks).toHaveBeenCalledWith(true);
    expect(mockTrackEvent).toHaveBeenCalled();
  });
});
