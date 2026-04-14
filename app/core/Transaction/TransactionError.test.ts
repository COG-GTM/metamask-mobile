import {
  TransactionError,
  ApproveTransactionError,
  CancelTransactionError,
  SpeedupTransactionError,
} from './TransactionError';

describe('TransactionError', () => {
  it('should create a TransactionError with correct message', () => {
    const error = new TransactionError('tx failed');
    expect(error.message).toBe('tx failed');
    expect(error.name).toBe('TransactionError');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof TransactionError).toBe(true);
  });

  it('should create an ApproveTransactionError', () => {
    const error = new ApproveTransactionError('approve failed');
    expect(error.message).toBe('approve failed');
    expect(error.name).toBe('ApproveTransactionError');
    expect(error instanceof TransactionError).toBe(true);
  });

  it('should create a CancelTransactionError', () => {
    const error = new CancelTransactionError('cancel failed');
    expect(error.message).toBe('cancel failed');
    expect(error instanceof TransactionError).toBe(true);
  });

  it('should create a SpeedupTransactionError', () => {
    const error = new SpeedupTransactionError('speedup failed');
    expect(error.message).toBe('speedup failed');
    expect(error instanceof TransactionError).toBe(true);
  });
});
