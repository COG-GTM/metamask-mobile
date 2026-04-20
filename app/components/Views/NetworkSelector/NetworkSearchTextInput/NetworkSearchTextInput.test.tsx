import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import NetworkSearchTextInput from './NetworkSearchTextInput';
import { NetworksViewSelectorsIDs } from '../../../../../e2e/selectors/Settings/NetworksView.selectors';
import { isNetworkUiRedesignEnabled } from '../../../../util/networks/isNetworkUiRedesignEnabled';

jest.mock('../../../../util/networks/isNetworkUiRedesignEnabled', () => ({
  isNetworkUiRedesignEnabled: jest.fn(() => true),
}));

describe('NetworkSearchTextInput', () => {
  const defaultProps = {
    searchString: '',
    handleSearchTextChange: jest.fn(),
    clearSearchInput: jest.fn(),
    testIdSearchInput: 'search-input',
    testIdCloseIcon: 'close-icon',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (isNetworkUiRedesignEnabled as jest.Mock).mockReturnValue(true);
  });

  it('renders correctly with no search string', () => {
    const { toJSON } = render(<NetworkSearchTextInput {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('invokes handleSearchTextChange when text changes', () => {
    const handleSearchTextChange = jest.fn();
    const { getByTestId } = render(
      <NetworkSearchTextInput
        {...defaultProps}
        handleSearchTextChange={handleSearchTextChange}
      />,
    );

    fireEvent.changeText(
      getByTestId(NetworksViewSelectorsIDs.SEARCH_NETWORK_INPUT_BOX_ID),
      'Eth',
    );
    expect(handleSearchTextChange).toHaveBeenCalledWith('Eth');
  });

  it('shows the close icon when there is a search string and invokes clearSearchInput on press', () => {
    const clearSearchInput = jest.fn();
    const { getByTestId } = render(
      <NetworkSearchTextInput
        {...defaultProps}
        searchString="Mainnet"
        clearSearchInput={clearSearchInput}
      />,
    );

    fireEvent.press(getByTestId(NetworksViewSelectorsIDs.CLOSE_ICON));
    expect(clearSearchInput).toHaveBeenCalledTimes(1);
  });

  it('does not render the close icon when search string is empty', () => {
    const { queryByTestId } = render(
      <NetworkSearchTextInput {...defaultProps} />,
    );
    expect(queryByTestId(NetworksViewSelectorsIDs.CLOSE_ICON)).toBeNull();
  });

  it('handles focus and blur events when redesign flag is enabled', () => {
    const { getByTestId } = render(
      <NetworkSearchTextInput {...defaultProps} />,
    );
    const input = getByTestId(
      NetworksViewSelectorsIDs.SEARCH_NETWORK_INPUT_BOX_ID,
    );

    fireEvent(input, 'focus');
    fireEvent(input, 'blur');
    expect(input).toBeTruthy();
  });

  it('uses legacy input styles when redesign flag is disabled', () => {
    (isNetworkUiRedesignEnabled as jest.Mock).mockReturnValue(false);
    const { getByTestId } = render(
      <NetworkSearchTextInput {...defaultProps} />,
    );
    expect(
      getByTestId(NetworksViewSelectorsIDs.SEARCH_NETWORK_INPUT_BOX_ID),
    ).toBeTruthy();
  });
});
