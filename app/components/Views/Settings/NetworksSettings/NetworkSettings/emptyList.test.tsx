import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';
import EmptyPopularList from './emptyList';
import Routes from '../../../../../constants/navigation/Routes';
import { CHAINLIST_URL } from '../../../../../constants/urls';
import { strings } from '../../../../../../locales/i18n';

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: jest.fn(),
  };
});

const initialState = {
  engine: { backgroundState },
};

describe('EmptyPopularList', () => {
  const mockNavigate = jest.fn();
  const mockGoToCustomNetwork = jest.fn();

  beforeEach(() => {
    mockNavigate.mockReset();
    mockGoToCustomNetwork.mockReset();
    (useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate });
  });

  it('renders correctly', () => {
    const { toJSON } = renderWithProvider(
      <EmptyPopularList goToCustomNetwork={mockGoToCustomNetwork} />,
      { state: initialState },
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('navigates to the browser tab when the chainlist link is pressed', () => {
    const { getByText } = renderWithProvider(
      <EmptyPopularList goToCustomNetwork={mockGoToCustomNetwork} />,
      { state: initialState },
    );

    const addOtherNetworkText = getByText(
      `${strings('networks.add_other_network_here')} `,
    );
    fireEvent.press(addOtherNetworkText);

    expect(mockNavigate).toHaveBeenCalledWith(
      'BrowserTabHome',
      expect.objectContaining({
        screen: Routes.BROWSER.VIEW,
        params: expect.objectContaining({ newTabUrl: CHAINLIST_URL }),
      }),
    );
  });

  it('calls goToCustomNetwork when the add_network link is pressed', () => {
    const { getByText } = renderWithProvider(
      <EmptyPopularList goToCustomNetwork={mockGoToCustomNetwork} />,
      { state: initialState },
    );

    fireEvent.press(getByText(strings('networks.add_network')));

    expect(mockGoToCustomNetwork).toHaveBeenCalledTimes(1);
  });
});
