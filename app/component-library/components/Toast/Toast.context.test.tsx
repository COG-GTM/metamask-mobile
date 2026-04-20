// Third party dependencies.
import React, { useContext } from 'react';
import { Text as RNText } from 'react-native';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import { ToastContext, ToastContextWrapper } from './Toast.context';

describe('Toast context', () => {
  it('provides undefined toastRef by default (outside wrapper)', () => {
    let captured: unknown;
    const Consumer = () => {
      const ctx = useContext(ToastContext);
      captured = ctx;
      return <RNText>consumer</RNText>;
    };
    render(<Consumer />);
    expect(captured).toEqual({ toastRef: undefined });
  });

  it('provides a ref when wrapped with ToastContextWrapper', () => {
    let captured: ReturnType<typeof useContext<typeof ToastContext>> | null =
      null;
    const Consumer = () => {
      captured = useContext(ToastContext);
      return <RNText>wrapped</RNText>;
    };
    render(
      <ToastContextWrapper>
        <Consumer />
      </ToastContextWrapper>,
    );
    expect(captured).not.toBeNull();
    expect((captured as { toastRef: unknown }).toastRef).toBeDefined();
  });
});
