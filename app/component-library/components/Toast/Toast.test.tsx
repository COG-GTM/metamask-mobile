// Third party dependencies.
import React from 'react';
import { render, act } from '@testing-library/react-native';

// Internal dependencies.
import Toast from './Toast';
import { ToastVariants, ToastRef } from './Toast.types';
import { ToastSelectorsIDs } from '../../../../e2e/selectors/wallet/ToastModal.selectors';

describe('Toast', () => {
  it('renders nothing until showToast is called', () => {
    const ref = React.createRef<ToastRef>();
    const { toJSON } = render(<Toast ref={ref} />);
    expect(toJSON()).toBeNull();
  });

  it('renders the toast container after showToast is invoked', () => {
    jest.useFakeTimers();
    const ref = React.createRef<ToastRef>();
    const { queryByTestId } = render(<Toast ref={ref} />);

    act(() => {
      ref.current?.showToast({
        variant: ToastVariants.Plain,
        labelOptions: [{ label: 'Hello', isBold: false }],
      });
      jest.runAllTimers();
    });

    expect(queryByTestId(ToastSelectorsIDs.CONTAINER)).toBeTruthy();
    jest.useRealTimers();
  });

  it('closeToast is callable without throwing', () => {
    const ref = React.createRef<ToastRef>();
    render(<Toast ref={ref} />);
    expect(() => ref.current?.closeToast()).not.toThrow();
  });
});
