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
    it('defines all network switch error types', () => {
      expect(NetworkSwitchErrorType.missingNetworkId).toBe('Missing network id');
      expect(NetworkSwitchErrorType.currentNetwork).toBe(
        'Already in current network',
      );
      expect(NetworkSwitchErrorType.unknownNetworkId).toBe(
        'Unknown network with id',
      );
      expect(NetworkSwitchErrorType.missingChainId).toBe('Missing chain id');
    });
  });

  describe('transaction errors', () => {
    it('exports NEGATIVE_TOKEN_DECIMALS', () => {
      expect(NEGATIVE_TOKEN_DECIMALS).toBe(
        'Token decimals can not be negative',
      );
    });

    it('exports NETWORK_ERROR_UNKNOWN_CHAIN_ID', () => {
      expect(NETWORK_ERROR_UNKNOWN_CHAIN_ID).toBe('Unknown chain id');
    });
  });

  describe('QR hardware errors', () => {
    it('exports KEYSTONE_TX_CANCELED', () => {
      expect(KEYSTONE_TX_CANCELED).toBe('KeystoneError#Tx_canceled');
    });
  });

  describe('password errors', () => {
    it('exports WRONG_PASSWORD_ERROR', () => {
      expect(WRONG_PASSWORD_ERROR).toBe('error: Invalid password');
    });

    it('exports UNRECOGNIZED_PASSWORD_STRENGTH', () => {
      expect(UNRECOGNIZED_PASSWORD_STRENGTH).toBe(
        'Unrecognized password strength.',
      );
    });
  });

  describe('contact flow errors', () => {
    it('exports CONTACT_ALREADY_SAVED', () => {
      expect(CONTACT_ALREADY_SAVED).toBe('contactAlreadySaved');
    });

    it('exports SYMBOL_ERROR', () => {
      expect(SYMBOL_ERROR).toBe('symbolError');
    });
  });

  describe('authentication errors', () => {
    it('exports all authentication error constants as non-empty strings', () => {
      const authErrors = [
        AUTHENTICATION_APP_TRIGGERED_AUTH_NO_CREDENTIALS,
        AUTHENTICATION_APP_TRIGGERED_AUTH_ERROR,
        AUTHENTICATION_FAILED_WALLET_CREATION,
        AUTHENTICATION_FAILED_TO_LOGIN,
        AUTHENTICATION_RESET_PASSWORD_FAILED_MESSAGE,
        AUTHENTICATION_RESET_PASSWORD_FAILED,
        AUTHENTICATION_STORE_PASSWORD_FAILED,
        AUTHENTICATION_LOGIN_VAULT_CREATION_FAILED,
      ];
      authErrors.forEach((error) => {
        expect(typeof error).toBe('string');
        expect(error.length).toBeGreaterThan(0);
      });
    });
  });

  describe('vault errors', () => {
    it('exports VAULT_CREATION_ERROR', () => {
      expect(VAULT_CREATION_ERROR).toBe('Error creating the vault');
    });

    it('exports NO_VAULT_IN_BACKUP_ERROR', () => {
      expect(NO_VAULT_IN_BACKUP_ERROR).toBe('No vault in backup');
    });
  });

  describe('RPC errors', () => {
    it('exports TOKEN_NOT_SUPPORTED_FOR_NETWORK', () => {
      expect(TOKEN_NOT_SUPPORTED_FOR_NETWORK).toBe(
        'This token is not supported on this network',
      );
    });

    it('exports TOKEN_NOT_VALID', () => {
      expect(typeof TOKEN_NOT_VALID).toBe('string');
    });
  });
});
