export const PASSCODE_NOT_SET_ERROR = 'Error: Passcode not set.';
export const WRONG_PASSWORD_ERROR = 'Error: Decrypt failed';
const OPENSSL_BAD_DECRYPT_ERROR =
  'error:1e000065:Cipher functions:OPENSSL_internal:BAD_DECRYPT';
export const WRONG_PASSWORD_ERROR_ANDROID = `Error: ${OPENSSL_BAD_DECRYPT_ERROR}`;
  export const WRONG_PASSWORD_ERROR_ANDROID_2 =
  'Error: error in DoCipher, status: 2';
export const VAULT_ERROR = 'Cannot unlock without a previous vault.';
export const DENY_PIN_ERROR_ANDROID = 'Error: Error: Cancel';
export const JSON_PARSE_ERROR_UNEXPECTED_TOKEN = 'Error: JSON Parse error';
export const PASSWORD_REQUIREMENTS_NOT_MET = 'Password requirements not met';
