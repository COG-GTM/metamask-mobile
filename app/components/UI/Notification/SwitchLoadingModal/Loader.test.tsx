import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import Loader from './Loader';
import renderWithProvider from '../../../../util/test/renderWithProvider';

jest.mock('../../../../../locales/i18n', () => ({
  strings: jest.fn((key: string) => key),
}));

describe('Loader', () => {
  it('renders correctly with loading text only', () => {
    const { toJSON } = renderWithProvider(
      <Loader loadingText="Loading notifications" onDismiss={jest.fn()} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('shows the loading text and no dismiss button when errorText is absent', () => {
    const { getByText, queryByText } = renderWithProvider(
      <Loader loadingText="Loading notifications" onDismiss={jest.fn()} />,
    );
    expect(getByText('Loading notifications')).toBeDefined();
    expect(queryByText('app_settings.notifications_dismiss_modal')).toBeNull();
  });

  it('shows the error text and a dismiss button when errorText is provided', () => {
    const onDismiss = jest.fn();
    const { getByText } = renderWithProvider(
      <Loader
        loadingText="Loading"
        errorText='Something went "wrong"'
        onDismiss={onDismiss}
      />,
    );
    // Double quotes are stripped before display
    expect(getByText('Something went wrong')).toBeDefined();
    const dismissBtn = getByText('app_settings.notifications_dismiss_modal');
    expect(dismissBtn).toBeDefined();
    fireEvent.press(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('strips double quotes from the loading text', () => {
    const { getByText } = renderWithProvider(
      <Loader loadingText={'Loading "stuff"'} onDismiss={jest.fn()} />,
    );
    expect(getByText('Loading stuff')).toBeDefined();
  });
});
