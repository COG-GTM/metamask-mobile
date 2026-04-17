import {
  NetworkSwitchErrorType,
  NEGATIVE_TOKEN_DECIMALS,
  NETWORK_ERROR_UNKNOWN_CHAIN_ID,
  KEYSTONE_TX_CANCELED,
  WRONG_PASSWORD_ERROR,
  UNRECOGNIZED_PASSWORD_STRENGTH,
  CONTACT_ALREADY_SAVED,
  SYMBOL_ERROR,
  AUTHENTICATION_APP_TRIGGERED_AUTH_NO_CREDENTIALS,
  AUTHENTICATION_APP_TRIGGERED_AUTH_ERROR,
  AUTHENTICATION_FAILED_WALLET_CREATION,
  AUTHENTICATION_FAILED_TO_LOGIN,
  AUTHENTICATION_RESET_PASSWORD_FAILED_MESSAGE,
  AUTHENTICATION_RESET_PASSWORD_FAILED,
  AUTHENTICATION_STORE_PASSWORD_FAILED,
  AUTHENTICATION_LOGIN_VAULT_CREATION_FAILED,
  VAULT_CREATION_ERROR,
  NO_VAULT_IN_BACKUP_ERROR,
  TOKEN_NOT_SUPPORTED_FOR_NETWORK,
  TOKEN_NOT_VALID,
} from './error';

describe('error constants', () => {
  describe('NetworkSwitchErrorType', () => {
    it('has missingNetworkId', () => {
      expect(NetworkSwitchErrorType.missingNetworkId).toBe('Missing network id');
    });
    it('has currentNetwork', () => {
      expect(NetworkSwitchErrorType.currentNetwork).toBe('Already in current network');
    });
    it('has unknownNetworkId', () => {
      expect(NetworkSwitchErrorType.unknownNetworkId).toBe('Unknown network with id');
    });
    it('has missingChainId', () => {
      expect(NetworkSwitchErrorType.missingChainId).toBe('Missing chain id');
    });
  });

  it('NEGATIVE_TOKEN_DECIMALS', () => {
    expect(NEGATIVE_TOKEN_DECIMALS).toBe('Token decimals can not be negative');
  });

  it('NETWORK_ERROR_UNKNOWN_CHAIN_ID', () => {
    expect(NETWORK_ERROR_UNKNOWN_CHAIN_ID).toBe('Unknown chain id');
  });

  it('KEYSTONE_TX_CANCELED', () => {
    expect(KEYSTONE_TX_CANCELED).toBe('KeystoneError#Tx_canceled');
  });

  it('WRONG_PASSWORD_ERROR', () => {
    expect(WRONG_PASSWORD_ERROR).toBe('error: Invalid password');
  });

  it('UNRECOGNIZED_PASSWORD_STRENGTH', () => {
    expect(UNRECOGNIZED_PASSWORD_STRENGTH).toBe('Unrecognized password strength.');
  });

  it('CONTACT_ALREADY_SAVED', () => {
    expect(CONTACT_ALREADY_SAVED).toBe('contactAlreadySaved');
  });

  it('SYMBOL_ERROR', () => {
    expect(SYMBOL_ERROR).toBe('symbolError');
  });

  it('AUTHENTICATION_APP_TRIGGERED_AUTH_NO_CREDENTIALS', () => {
    expect(AUTHENTICATION_APP_TRIGGERED_AUTH_NO_CREDENTIALS).toBe(
      'Password does not exist when calling SecureKeychain.getGenericPassword',
    );
  });

  it('AUTHENTICATION_APP_TRIGGERED_AUTH_ERROR', () => {
    expect(AUTHENTICATION_APP_TRIGGERED_AUTH_ERROR).toBe(
      'Authentication.appTriggeredAuth failed to login',
    );
  });

  it('AUTHENTICATION_FAILED_WALLET_CREATION', () => {
    expect(AUTHENTICATION_FAILED_WALLET_CREATION).toBe('Failed wallet creation');
  });

  it('AUTHENTICATION_FAILED_TO_LOGIN', () => {
    expect(AUTHENTICATION_FAILED_TO_LOGIN).toBe('Failed to login');
  });

  it('AUTHENTICATION_RESET_PASSWORD_FAILED_MESSAGE', () => {
    expect(AUTHENTICATION_RESET_PASSWORD_FAILED_MESSAGE).toContain(
      'Authentication.resetPassword failed',
    );
  });

  it('AUTHENTICATION_RESET_PASSWORD_FAILED', () => {
    expect(AUTHENTICATION_RESET_PASSWORD_FAILED).toBe('Authentication.resetPassword failed');
  });

  it('AUTHENTICATION_STORE_PASSWORD_FAILED', () => {
    expect(AUTHENTICATION_STORE_PASSWORD_FAILED).toBe('Authentication.storePassword failed');
  });

  it('AUTHENTICATION_LOGIN_VAULT_CREATION_FAILED', () => {
    expect(AUTHENTICATION_LOGIN_VAULT_CREATION_FAILED).toContain('unable to recreate vault');
  });

  it('VAULT_CREATION_ERROR', () => {
    expect(VAULT_CREATION_ERROR).toBe('Error creating the vault');
  });

  it('NO_VAULT_IN_BACKUP_ERROR', () => {
    expect(NO_VAULT_IN_BACKUP_ERROR).toBe('No vault in backup');
  });

  it('TOKEN_NOT_SUPPORTED_FOR_NETWORK', () => {
    expect(TOKEN_NOT_SUPPORTED_FOR_NETWORK).toBe('This token is not supported on this network');
  });

  it('TOKEN_NOT_VALID', () => {
    expect(TOKEN_NOT_VALID).toBeDefined();
    expect(typeof TOKEN_NOT_VALID).toBe('string');
  });
});
