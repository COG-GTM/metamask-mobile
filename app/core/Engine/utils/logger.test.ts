import { logEngineCreation } from './logger';
import Logger from '../../../util/Logger';

jest.mock('../../../util/Logger', () => ({
  log: jest.fn(),
}));

describe('logEngineCreation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs empty state message when initialState is empty', () => {
    logEngineCreation({});
    expect(Logger.log).toHaveBeenCalledWith('Engine initialized with empty state', {
      keyringStateFromBackup: false,
    });
  });

  it('logs empty state message when initialState is undefined', () => {
    logEngineCreation();
    expect(Logger.log).toHaveBeenCalledWith('Engine initialized with empty state', {
      keyringStateFromBackup: false,
    });
  });

  it('logs empty state with keyringStateFromBackup true when initialKeyringState is provided', () => {
    const initialKeyringState = {
      isUnlocked: false,
      keyrings: [],
    };
    logEngineCreation({}, initialKeyringState);
    expect(Logger.log).toHaveBeenCalledWith('Engine initialized with empty state', {
      keyringStateFromBackup: true,
    });
  });

  it('logs non-empty state message when initialState has AccountsController', () => {
    const initialState = {
      AccountsController: {
        internalAccounts: {
          accounts: {},
          selectedAccount: '',
        },
      },
    };
    logEngineCreation(initialState);
    expect(Logger.log).toHaveBeenCalledWith('Engine initialized with non-empty state', {
      hasAccountsState: true,
      hasKeyringState: false,
      keyringStateFromBackup: false,
    });
  });

  it('logs non-empty state message when initialState has KeyringController', () => {
    const initialState = {
      KeyringController: {
        isUnlocked: false,
        keyrings: [],
      },
    };
    logEngineCreation(initialState);
    expect(Logger.log).toHaveBeenCalledWith('Engine initialized with non-empty state', {
      hasAccountsState: false,
      hasKeyringState: true,
      keyringStateFromBackup: false,
    });
  });

  it('logs non-empty state with all flags true', () => {
    const initialState = {
      AccountsController: {
        internalAccounts: {
          accounts: {},
          selectedAccount: '',
        },
      },
      KeyringController: {
        isUnlocked: false,
        keyrings: [],
      },
    };
    const initialKeyringState = {
      isUnlocked: false,
      keyrings: [],
    };
    logEngineCreation(initialState, initialKeyringState);
    expect(Logger.log).toHaveBeenCalledWith('Engine initialized with non-empty state', {
      hasAccountsState: true,
      hasKeyringState: true,
      keyringStateFromBackup: true,
    });
  });
});
