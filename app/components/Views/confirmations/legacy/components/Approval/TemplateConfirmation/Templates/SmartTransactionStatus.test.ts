import smartTransactionStatus from './SmartTransactionStatus';

describe('SmartTransactionStatus template', () => {
  const pendingApproval = {
    id: 'a1',
    type: 'smart_transaction_status',
    origin: 'https://example.com',
    requestState: { status: 'pending' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const strings = (key: string) => key;
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  const colors = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  it('returns a SmartTransactionStatus content node wired to the approval state', () => {
    const values = smartTransactionStatus.getValues(
      pendingApproval,
      strings,
      { onConfirm, onCancel },
      colors,
    );

    expect(values.content).toEqual([
      {
        key: 'smart-transaction-status',
        element: 'SmartTransactionStatus',
        props: {
          requestState: pendingApproval.requestState,
          origin: pendingApproval.origin,
          onConfirm,
        },
      },
    ]);
  });

  it('hides both the confirm and cancel buttons', () => {
    const values = smartTransactionStatus.getValues(
      pendingApproval,
      strings,
      { onConfirm, onCancel },
      colors,
    );

    expect(values.hideCancelButton).toBe(true);
    expect(values.hideSubmitButton).toBe(true);
  });

  it('provides noop-like onConfirm and onCancel that do not close the status modal', () => {
    const values = smartTransactionStatus.getValues(
      pendingApproval,
      strings,
      { onConfirm, onCancel },
      colors,
    );

    // onCancel is intentionally a noop to avoid auto-dismissal of the status modal.
    expect(values.onCancel?.()).toBeUndefined();
    expect(onCancel).not.toHaveBeenCalled();

    // onConfirm returns the underlying action instead of invoking it for the
    // same reason — the status modal should stay up until the user dismisses.
    expect(values.onConfirm?.()).toBe(onConfirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
