import { renderHook } from '@testing-library/react-native';
import React from 'react';
import { useStakeContext } from './useStakeContext';
import { Stake, StakeContext } from '../sdk/stakeSdkProvider';

describe('useStakeContext', () => {
  it('throws when used outside a StakeProvider', () => {
    const { result } = renderHook(() => {
      try {
        return useStakeContext();
      } catch (error) {
        return error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toBe(
      'useStakeContext must be used within a StakeProvider',
    );
  });

  it('returns the context value when wrapped in a StakeProvider', () => {
    const value = {
      setSdkType: jest.fn(),
      networkClientId: 'test-client',
    } as unknown as Stake;

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(StakeContext.Provider, { value }, children);

    const { result } = renderHook(() => useStakeContext(), { wrapper });

    expect(result.current).toBe(value);
  });
});
