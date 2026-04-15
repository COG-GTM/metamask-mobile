import { validatePostMigrationState } from './validateMigration';

import Logger from '../../util/Logger';
import { validateAccountsController } from './accountsController';
import { validateKeyringController } from './keyringController';
import { validateEngineInitialized } from './engineBackgroundState';

jest.mock('../../util/Logger', () => ({
  error: jest.fn(),
  log: jest.fn()
}));

jest.mock('./accountsController');
jest.mock('./keyringController');
jest.mock('./engineBackgroundState');

const TOTAL_VALIDATION_CHECKS = 3;

describe('validatePostMigrationState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validateEngineInitialized.mockReturnValue([]);
    validateAccountsController.mockReturnValue([]);
    validateKeyringController.mockReturnValue([]);
  });

  it('logs when validation starts', () => {
    const mockState = {};
    validatePostMigrationState(mockState);

    expect(Logger.log).toHaveBeenCalledWith('Migration validation started');
    expect(Logger.log).toHaveBeenCalledTimes(1);
  });

  it('runs all validation checks', () => {
    const mockState = {};
    validatePostMigrationState(mockState);

    expect(validateEngineInitialized).toHaveBeenCalledWith(mockState);
    expect(validateKeyringController).toHaveBeenCalledWith(mockState);
    expect(validateAccountsController).toHaveBeenCalledWith(mockState);

    const totalCalls =
    validateAccountsController.mock.calls.length +
    validateKeyringController.mock.calls.length +
    validateEngineInitialized.mock.calls.length;

    expect(totalCalls).toBe(TOTAL_VALIDATION_CHECKS);
  });

  it('logs errors when validation checks return errors', () => {
    const mockState = {};
    const mockError = 'Mock validation error';

    // Mock one of the validation checks to return an error
    validateAccountsController.mockReturnValue([mockError]);

    validatePostMigrationState(mockState);

    // Verify error was logged
    expect(Logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        message: expect.stringContaining(mockError)
      })
    );
  });

  it('does not log when no validation errors occur', () => {
    const mockState = {};
    validatePostMigrationState(mockState);

    // Verify no errors were logged
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it('does not throw when validation checks fail', () => {
    const mockState = {};
    // Mock all validation checks to return errors
    const mockErrors = ['Error 1', 'Error 2', 'Error 3'];
    validateEngineInitialized.mockReturnValue([mockErrors[0]]);
    validateAccountsController.mockReturnValue([mockErrors[1]]);
    validateKeyringController.mockReturnValue([mockErrors[2]]);

    // Verify that calling validatePostMigrationState does not throw
    expect(() => validatePostMigrationState(mockState)).not.toThrow();

    // Verify that errors were logged but execution continued
    expect(Logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        message: expect.stringContaining(mockErrors.join(', '))
      })
    );
  });
});