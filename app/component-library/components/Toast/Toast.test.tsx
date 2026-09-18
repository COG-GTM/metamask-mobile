// Third party dependencies.
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

// External dependencies.
import { AvatarAccountType } from '../Avatars/Avatar/variants/AvatarAccount';
import { IconName } from '../Icons/Icon';
import { ButtonVariants } from '../Buttons/Button';
import { ToastSelectorsIDs } from '../../../../e2e/selectors/wallet/ToastModal.selectors';

// Internal dependencies.
import Toast from './Toast';
import { ToastOptions, ToastRef, ToastVariants } from './Toast.types';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

const MOCK_ADDRESS = '0x2990079bcdEe240329a520d2444386FC119da21a';

const renderToast = () => {
  const ref = React.createRef<ToastRef>();
  const utils = render(<Toast ref={ref} />);
  return { ref, ...utils };
};

const showToast = (ref: React.RefObject<ToastRef>, options: ToastOptions) => {
  act(() => {
    ref.current?.showToast(options);
    jest.advanceTimersByTime(200);
  });
};

const layoutToast = (
  getByTestId: ReturnType<typeof render>['getByTestId'],
) => {
  const container = getByTestId(ToastSelectorsIDs.CONTAINER);
  act(() => {
    fireEvent(container.parent as NonNullable<typeof container.parent>, 'layout', {
      nativeEvent: { layout: { height: 100 } },
    });
  });
};

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing before a toast is shown', () => {
    const { toJSON } = renderToast();
    expect(toJSON()).toBeNull();
  });

  it('renders a plain toast with bold and regular labels', () => {
    const { ref, getByText, getByTestId } = renderToast();

    showToast(ref, {
      variant: ToastVariants.Plain,
      hasNoTimeout: false,
      labelOptions: [
        { label: 'Hello ', isBold: true },
        { label: 'world' },
      ],
    });

    expect(getByTestId(ToastSelectorsIDs.CONTAINER)).toBeTruthy();
    expect(getByText('Hello ')).toBeTruthy();
    expect(getByText('world')).toBeTruthy();
  });

  it('renders an account toast', () => {
    const { ref, getByTestId } = renderToast();

    showToast(ref, {
      variant: ToastVariants.Account,
      hasNoTimeout: false,
      accountAddress: MOCK_ADDRESS,
      accountAvatarType: AvatarAccountType.JazzIcon,
      labelOptions: [{ label: 'Account switched' }],
    });

    expect(getByTestId(ToastSelectorsIDs.CONTAINER)).toBeTruthy();
  });

  it('renders a network toast', () => {
    const { ref, getByTestId } = renderToast();

    showToast(ref, {
      variant: ToastVariants.Network,
      hasNoTimeout: false,
      networkName: 'Ethereum',
      networkImageSource: { uri: 'https://example.com/eth.png' },
      labelOptions: [{ label: 'Network switched' }],
    });

    expect(getByTestId(ToastSelectorsIDs.CONTAINER)).toBeTruthy();
  });

  it('renders an icon toast', () => {
    const { ref, getByTestId } = renderToast();

    showToast(ref, {
      variant: ToastVariants.Icon,
      hasNoTimeout: true,
      iconName: IconName.Check,
      iconColor: '#fff',
      backgroundColor: '#000',
      labelOptions: [{ label: 'Done' }],
    });

    expect(getByTestId(ToastSelectorsIDs.CONTAINER)).toBeTruthy();
  });

  it('renders link and close buttons and forwards presses', () => {
    const onLinkPress = jest.fn();
    const onClosePress = jest.fn();
    const { ref, getByText } = renderToast();

    showToast(ref, {
      variant: ToastVariants.Plain,
      hasNoTimeout: true,
      labelOptions: [{ label: 'With buttons' }],
      linkButtonOptions: { label: 'Learn more', onPress: onLinkPress },
      closeButtonOptions: {
        variant: ButtonVariants.Primary,
        label: 'Close',
        onPress: onClosePress,
      },
    });

    fireEvent.press(getByText('Learn more'));
    fireEvent.press(getByText('Close'));

    expect(onLinkPress).toHaveBeenCalledTimes(1);
    expect(onClosePress).toHaveBeenCalledTimes(1);
  });

  it('replaces the current toast when another one is shown', () => {
    const { ref, getByText, queryByText } = renderToast();

    showToast(ref, {
      variant: ToastVariants.Plain,
      hasNoTimeout: false,
      labelOptions: [{ label: 'First' }],
    });
    expect(getByText('First')).toBeTruthy();

    showToast(ref, {
      variant: ToastVariants.Plain,
      hasNoTimeout: true,
      labelOptions: [{ label: 'Second' }],
    });

    expect(queryByText('First')).toBeNull();
    expect(getByText('Second')).toBeTruthy();
  });

  it('animates in on layout for timed and persistent toasts', () => {
    const { ref, getByTestId } = renderToast();

    showToast(ref, {
      variant: ToastVariants.Plain,
      hasNoTimeout: false,
      labelOptions: [{ label: 'Timed' }],
    });
    layoutToast(getByTestId);

    showToast(ref, {
      variant: ToastVariants.Plain,
      hasNoTimeout: true,
      labelOptions: [{ label: 'Persistent' }],
    });
    layoutToast(getByTestId);

    expect(getByTestId(ToastSelectorsIDs.CONTAINER)).toBeTruthy();
  });

  it('closes the toast imperatively', () => {
    const { ref, getByTestId, queryByTestId } = renderToast();

    showToast(ref, {
      variant: ToastVariants.Plain,
      hasNoTimeout: true,
      labelOptions: [{ label: 'Closable' }],
    });
    expect(getByTestId(ToastSelectorsIDs.CONTAINER)).toBeTruthy();

    act(() => {
      ref.current?.closeToast();
      jest.runOnlyPendingTimers();
    });

    expect(queryByTestId(ToastSelectorsIDs.CONTAINER)).toBeNull();
  });
});
