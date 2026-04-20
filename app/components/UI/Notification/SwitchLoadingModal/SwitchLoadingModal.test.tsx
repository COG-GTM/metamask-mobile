import React from 'react';
import { act } from '@testing-library/react-native';
import SwitchLoadingModal from './SwitchLoadingModal';
import renderWithProvider from '../../../../util/test/renderWithProvider';

jest.mock('react-native-modal', () => {
  const ReactModule = jest.requireActual('react');
  const RN = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({
      isVisible,
      children,
    }: {
      isVisible: boolean;
      children: React.ReactNode;
    }) =>
      isVisible
        ? ReactModule.createElement(
            RN.View,
            { testID: 'react-native-modal' },
            children,
          )
        : null,
  };
});

jest.mock('../../../../../locales/i18n', () => ({
  strings: jest.fn((key: string) => key),
}));

describe('SwitchLoadingModal', () => {
  it('renders correctly when loading is true', () => {
    const { toJSON } = renderWithProvider(
      <SwitchLoadingModal loading loadingText="Loading" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the modal when loading is true', () => {
    const { getByTestId } = renderWithProvider(
      <SwitchLoadingModal loading loadingText="Loading" />,
    );
    expect(getByTestId('react-native-modal')).toBeDefined();
  });

  it('does not render the modal initially when loading is false and no error', () => {
    const { queryByTestId } = renderWithProvider(
      <SwitchLoadingModal loading={false} loadingText="Loading" />,
    );
    expect(queryByTestId('react-native-modal')).toBeNull();
  });

  it('renders the modal when an error is provided even if loading is false', () => {
    const { getByTestId } = renderWithProvider(
      <SwitchLoadingModal
        loading={false}
        loadingText="Loading"
        error="Something went wrong"
      />,
    );
    expect(getByTestId('react-native-modal')).toBeDefined();
  });

  it('hides the modal when transitioning from loading to non-loading without an error', () => {
    const { rerender, queryByTestId } = renderWithProvider(
      <SwitchLoadingModal loading loadingText="Loading" />,
    );
    expect(queryByTestId('react-native-modal')).toBeDefined();

    act(() => {
      rerender(<SwitchLoadingModal loading={false} loadingText="Loading" />);
    });
    expect(queryByTestId('react-native-modal')).toBeNull();
  });
});
