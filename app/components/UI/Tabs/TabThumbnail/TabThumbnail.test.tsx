import React from 'react';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../util/test/initial-root-state';
import TabThumbnail from './TabThumbnail';
import { fireEvent } from '@testing-library/react-native';
import { strings } from '../../../../../locales/i18n';
import { getPermittedAccountsByHostname } from '../../../../core/Permissions';
import {
  MOCK_ACCOUNTS_CONTROLLER_STATE,
  MOCK_ADDRESS_1,
} from '../../../../util/test/accountsControllerTestUtils';

jest.mock('../../../../core/Permissions', () => ({
  ...jest.requireActual('../../../../core/Permissions'),
  getPermittedAccountsByHostname: jest.fn(),
}));

const mockGetPermittedAccountsByHostname =
  getPermittedAccountsByHostname as jest.Mock;

const mockTab = {
  url: 'https://example.com',
  image: 'test-image-uri',
  id: 123,
};

const stateWithAccounts = {
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
    },
  },
};

describe('TabThumbnail', () => {
  const mockOnClose = jest.fn();
  const mockOnSwitch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermittedAccountsByHostname.mockReturnValue([]);
  });

  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <TabThumbnail
        tab={mockTab}
        isActiveTab
        onClose={mockOnClose}
        onSwitch={mockOnSwitch}
      />,
      {
        state: {
          engine: {
            backgroundState,
          },
        },
      },
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should handle tab switching', () => {
    const { getByLabelText } = renderWithProvider(
      <TabThumbnail
        tab={mockTab}
        isActiveTab={false}
        onClose={mockOnClose}
        onSwitch={mockOnSwitch}
      />,
      {
        state: {
          engine: {
            backgroundState,
          },
        },
      },
    );

    const switchButton = getByLabelText(strings('browser.switch_tab'));
    fireEvent.press(switchButton);

    expect(mockOnSwitch).toHaveBeenCalledWith(mockTab);
  });

  it('should handle tab closing', () => {
    const { getByLabelText } = renderWithProvider(
      <TabThumbnail
        tab={mockTab}
        isActiveTab={false}
        onClose={mockOnClose}
        onSwitch={mockOnSwitch}
      />,
      {
        state: {
          engine: {
            backgroundState,
          },
        },
      },
    );

    const closeButton = getByLabelText(strings('browser.close_tab'));
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalledWith(mockTab);
  });

  it('should apply active tab styles when isActiveTab is true', () => {
    const { getByLabelText } = renderWithProvider(
      <TabThumbnail
        tab={mockTab}
        isActiveTab
        onClose={mockOnClose}
        onSwitch={mockOnSwitch}
      />,
      {
        state: {
          engine: {
            backgroundState,
          },
        },
      },
    );

    const switchButton = getByLabelText(strings('browser.switch_tab'));
    expect(switchButton.props.style[1]).toBeTruthy(); // Check if activeTab style is applied
  });

  it('should not render footer when no selectedAccount', () => {
    const { queryByTestId } = renderWithProvider(
      <TabThumbnail
        tab={mockTab}
        isActiveTab={false}
        onClose={mockOnClose}
        onSwitch={mockOnSwitch}
      />,
      {
        state: {
          engine: {
            backgroundState,
          },
        },
      },
    );

    expect(queryByTestId('footer-container')).toBeNull();
  });

  it('should render footer with the permitted account name and address', () => {
    mockGetPermittedAccountsByHostname.mockReturnValue([
      MOCK_ADDRESS_1.toLowerCase(),
    ]);

    const { getByTestId, getByText } = renderWithProvider(
      <TabThumbnail
        tab={mockTab}
        isActiveTab={false}
        onClose={mockOnClose}
        onSwitch={mockOnSwitch}
      />,
      { state: stateWithAccounts },
    );

    expect(getByTestId('footer-container')).toBeTruthy();
    expect(getByText(/Account 1/)).toBeTruthy();
  });

  it('should not render footer when the permitted account is unknown', () => {
    mockGetPermittedAccountsByHostname.mockReturnValue([
      '0x0000000000000000000000000000000000000000',
    ]);

    const { queryByTestId } = renderWithProvider(
      <TabThumbnail
        tab={mockTab}
        isActiveTab={false}
        onClose={mockOnClose}
        onSwitch={mockOnSwitch}
      />,
      { state: stateWithAccounts },
    );

    expect(queryByTestId('footer-container')).toBeNull();
  });
});
