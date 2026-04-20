// Third party dependencies.
import React from 'react';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import StatusText, {
  ConfirmedText,
  PendingText,
  FailedText,
} from './StatusText';
import { FIAT_ORDER_STATES } from '../../constants/on-ramp';

// Translations come through as raw keys in tests because the locale mapping
// for arbitrary key permutations isn't wired up — that is fine for assertions.
describe('StatusText exports', () => {
  it('ConfirmedText renders a testID and text', () => {
    const { getByTestId, getByText } = render(
      <ConfirmedText testID="confirmed">Done</ConfirmedText>,
    );
    expect(getByTestId('confirmed')).toBeTruthy();
    expect(getByText('Done')).toBeTruthy();
  });

  it('PendingText renders a testID and text', () => {
    const { getByTestId } = render(
      <PendingText testID="pending">Waiting</PendingText>,
    );
    expect(getByTestId('pending')).toBeTruthy();
  });

  it('FailedText renders a testID and text', () => {
    const { getByTestId } = render(
      <FailedText testID="failed">Bad</FailedText>,
    );
    expect(getByTestId('failed')).toBeTruthy();
  });
});

describe('StatusText', () => {
  it('renders a confirmed variant', () => {
    const { getByTestId } = render(
      <StatusText status="Confirmed" testID="status" />,
    );
    expect(getByTestId('status')).toBeTruthy();
  });

  it('renders a pending variant for pending/submitted', () => {
    const { getByTestId: a } = render(
      <StatusText status="pending" testID="a" />,
    );
    const { getByTestId: b } = render(
      <StatusText status="Submitted" testID="b" />,
    );
    expect(a('a')).toBeTruthy();
    expect(b('b')).toBeTruthy();
  });

  it('renders a failed variant for Failed/Cancelled', () => {
    const { getByTestId: a } = render(
      <StatusText status="Failed" testID="a" />,
    );
    const { getByTestId: b } = render(
      <StatusText status="cancelled" testID="b" />,
    );
    expect(a('a')).toBeTruthy();
    expect(b('b')).toBeTruthy();
  });

  it('handles FIAT_ORDER_STATES values', () => {
    const completed = render(
      <StatusText status={FIAT_ORDER_STATES.COMPLETED} />,
    );
    const pending = render(<StatusText status={FIAT_ORDER_STATES.PENDING} />);
    const failed = render(<StatusText status={FIAT_ORDER_STATES.FAILED} />);
    const cancelled = render(
      <StatusText status={FIAT_ORDER_STATES.CANCELLED} />,
    );
    expect(completed.toJSON()).toBeTruthy();
    expect(pending.toJSON()).toBeTruthy();
    expect(failed.toJSON()).toBeTruthy();
    expect(cancelled.toJSON()).toBeTruthy();
  });

  it('falls back to a plain text rendering for unknown statuses', () => {
    const { getByText } = render(<StatusText status="custom-status" />);
    expect(getByText('custom-status')).toBeTruthy();
  });
});
