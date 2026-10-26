import {
  TransactionError,
  ApproveTransactionError,
  CancelTransactionError,
  SpeedupTransactionError,
} from './TransactionError';

describe('TransactionError', () => {
  it('creates a named error with a message', () => {
    const error = new TransactionError('failed');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TransactionError);
    expect(error.message).toBe('failed');
    expect(error.name).toBe('TransactionError');
    expect(error.stack).toBeDefined();
  });

  it.each([
    ['ApproveTransactionError', ApproveTransactionError],
    ['CancelTransactionError', CancelTransactionError],
    ['SpeedupTransactionError', SpeedupTransactionError],
  ])('%s creates a TransactionError', (_name, ErrorClass) => {
    const error = new ErrorClass('oops');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TransactionError);
    expect(error.message).toBe('oops');
    expect(error.name).toBe('TransactionError');
  });

  it('works when Error.captureStackTrace is unavailable', () => {
    const original = Error.captureStackTrace;
    // @ts-expect-error simulate environments without captureStackTrace
    Error.captureStackTrace = undefined;
    try {
      const error = new TransactionError('no stack');
      expect(error.message).toBe('no stack');
    } finally {
      Error.captureStackTrace = original;
    }
  });
});
