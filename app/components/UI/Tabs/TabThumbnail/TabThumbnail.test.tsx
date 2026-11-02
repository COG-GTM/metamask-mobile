import React from 'react';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../util/test/initial-root-state';
import TabThumbnail from './TabThumbnail';
import { fireEvent } from '@testing-library/react-native';
import { strings } from '../../../../../locales/i18n';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import {
  MOCK_ACCOUNTS_CONTROLLER_STATE,
  MOCK_ADDRESS_1,
} from '../../../../util/test/accountsControllerTestUtils';
import { useAccounts } from '../../../hooks/useAccounts';

jest.mock('../../../hooks/useAccounts', () => ({
  useAccounts: jest.fn(() => ({
    accounts: [],
    evmAccounts: [],
    ensByAccountAddress: {},
  })),
}));

const mockTab = {
  url: 'https://example.com',
  image: 'test-image-uri',
  id: 123,
};

describe('TabThumbnail', () => {
  const mockOnClose = jest.fn();
  const mockOnSwitch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('renders the permitted account without running useAccounts', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <TabThumbnail
        tab={mockTab}
        isActiveTab={false}
        onClose={mockOnClose}
        onSwitch={mockOnSwitch}
      />,
      {
        state: {
          engine: {
            backgroundState: {
              ...backgroundState,
              AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
              PermissionController: {
                subjects: {
                  'example.com': {
                    permissions: {
                      [Caip25EndowmentPermissionName]: {
                        caveats: [
                          {
                            type: Caip25CaveatType,
                            value: {
                              requiredScopes: {},
                              optionalScopes: {
                                'eip155:1': {
                                  accounts: [
                                    `eip155:1:${MOCK_ADDRESS_1.toLowerCase()}`,
                                  ],
                                },
                              },
                              isMultichainOrigin: false,
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
              // TODO: Replace "any" with type
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
          },
        },
      },
    );

    expect(getByTestId('footer-container')).toBeTruthy();
    expect(getByText(/^Account 1/)).toBeTruthy();
    expect(useAccounts).not.toHaveBeenCalled();
  });
});
