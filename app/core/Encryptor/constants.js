

export const SALT_BYTES_COUNT = 32;
export const SHA256_DIGEST_LENGTH = 256;

/**
 * We use "OWASP2023" to indicate the source and year of the recommendation.
 * This will help us version the recommend number in case it changes in the future.
 * Source: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2
 */
export let KeyDerivationIteration = /*#__PURE__*/function (KeyDerivationIteration) {
  // Legacy, kept for backward compatibility
  KeyDerivationIteration[KeyDerivationIteration["Legacy5000"] = 5000] = "Legacy5000";
  // OWASP's 2023 recommendation for minimum iterations
  KeyDerivationIteration[KeyDerivationIteration["OWASP2023Minimum"] = 600000] = "OWASP2023Minimum";
  // Default suggested iterations based on OWASP's 2023 recommendation
  KeyDerivationIteration[KeyDerivationIteration["OWASP2023Default"] = 900000] = "OWASP2023Default";return KeyDerivationIteration;}({});


/**
 * Used as a "tag" to identify the underlying encryption library.
 *
 * When no tag is specified, this means our "forked" encryption library has been used.
 */
export const ENCRYPTION_LIBRARY = {
  original: 'original',
  forked: 'forked',
  quickCrypto: 'quick-crypto'
};

/**
 * Key derivation algorithm used to generate keys from a password.
 */
export const KDF_ALGORITHM = 'PBKDF2';

/**
 * Default key derivation options.
 */
export const LEGACY_DERIVATION_OPTIONS = {
  algorithm: KDF_ALGORITHM,
  params: {
    iterations: KeyDerivationIteration.Legacy5000
  }
};

export const DERIVATION_OPTIONS_MINIMUM_OWASP2023 = {
  algorithm: KDF_ALGORITHM,
  params: {
    iterations: KeyDerivationIteration.OWASP2023Minimum
  }
};

export const DERIVATION_OPTIONS_DEFAULT_OWASP2023 = {
  algorithm: KDF_ALGORITHM,
  params: {
    iterations: KeyDerivationIteration.OWASP2023Default
  }
};