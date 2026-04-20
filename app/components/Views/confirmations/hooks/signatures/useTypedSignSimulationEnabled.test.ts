import { cloneDeep } from 'lodash';

import { renderHookWithProvider } from '../../../../../util/test/renderWithProvider';
import {
  typedSignV1ConfirmationState,
  typedSignV3ConfirmationState,
  typedSignV4ConfirmationState,
} from '../../../../../util/test/confirm-data-helpers';
import { useTypedSignSimulationEnabled } from './useTypedSignSimulationEnabled';

const setUseTransactionSimulations = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
  enabled: boolean,
) => {
  const next = cloneDeep(state);
  next.engine.backgroundState.PreferencesController.useTransactionSimulations =
    enabled;
  return next;
};

describe('useTypedSignSimulationEnabled', () => {
  it('returns undefined when there is no signature request', () => {
    const state = cloneDeep(typedSignV3ConfirmationState);
    state.engine.backgroundState.SignatureController.signatureRequests =
      {} as typeof state.engine.backgroundState.SignatureController.signatureRequests;
    state.engine.backgroundState.ApprovalController.pendingApprovals =
      {} as typeof state.engine.backgroundState.ApprovalController.pendingApprovals;

    const { result } = renderHookWithProvider(useTypedSignSimulationEnabled, {
      state,
    });

    expect(result.current).toBeUndefined();
  });

  it('returns false when the simulation preference is disabled', () => {
    const { result } = renderHookWithProvider(useTypedSignSimulationEnabled, {
      state: setUseTransactionSimulations(typedSignV4ConfirmationState, false),
    });

    expect(result.current).toBe(false);
  });

  it('returns true for a V4 permit signature request when simulations are on', () => {
    const { result } = renderHookWithProvider(useTypedSignSimulationEnabled, {
      state: setUseTransactionSimulations(typedSignV4ConfirmationState, true),
    });

    expect(result.current).toBe(true);
  });

  it('returns false for a V1 typed-sign request (not V3/V4)', () => {
    const { result } = renderHookWithProvider(useTypedSignSimulationEnabled, {
      state: setUseTransactionSimulations(typedSignV1ConfirmationState, true),
    });

    expect(result.current).toBe(false);
  });
});
