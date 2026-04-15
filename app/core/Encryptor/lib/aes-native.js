import { NativeModules } from 'react-native';
import {
  KDF_ALGORITHM,
  SHA256_DIGEST_LENGTH,
  LEGACY_DERIVATION_OPTIONS } from
'./../constants';


/**
 * Supported SHA algorithms in react-native-aes v3.0.3
 */var
HashAlgorithmAesCrypto = /*#__PURE__*/function (HashAlgorithmAesCrypto) {HashAlgorithmAesCrypto["Sha256"] = "sha256";HashAlgorithmAesCrypto["Sha512"] = "sha512";return HashAlgorithmAesCrypto;}(HashAlgorithmAesCrypto || {});




/**
 * Supported cipher algorithms in react-native-aes v3.0.3
 *
 * Important Note: Make sure to validate the compatibility of the algorithm with the underlying library.
 * The react-native-aes-crypto does a string validation for the algorithm, so it's important to make sure
 * we're using the correct string.
 *
 * References:
 * - encrypt: https://github.com/MetaMask/metamask-mobile/pull/9947#:~:text=When-,encrypting,-and%20decypting%20the
 * - decrypt: https://github.com/MetaMask/metamask-mobile/pull/9947#:~:text=When%20encrypting%20and-,decypting,-the%20library%20uses
 */var
CipherAlgorithmAesCrypto = /*#__PURE__*/function (CipherAlgorithmAesCrypto) {CipherAlgorithmAesCrypto["Cbc"] = "aes-cbc-pkcs7padding";CipherAlgorithmAesCrypto["Ctr"] = "aes-ctr-pkcs5padding";return CipherAlgorithmAesCrypto;}(CipherAlgorithmAesCrypto || {});




// Actual native libraries
const Aes = NativeModules.Aes;
const AesForked = NativeModules.AesForked;

export function assertIsKdfAlgorithm(algorithm) {
  if (algorithm !== KDF_ALGORITHM) {
    throw new Error('Unsupported KDF algorithm');
  }
}

/**
 * @deprecated This class is deprecated and will be removed in future versions.
 * Please use `QuickCryptoEncryptionLibrary` instead.
 */
class AesEncryptionLibrary {
  deriveKey = async (
  password,
  salt,
  opts) =>
  {
    assertIsKdfAlgorithm(opts.algorithm);

    return await Aes.pbkdf2(
      password,
      salt,
      opts.params.iterations,
      // We're using SHA512 but returning a key with length 256 bits.
      // Truncating the output to 256 bits is intentional and considered safe.
      //
      // References:
      // - https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf
      // - https://eprint.iacr.org/2010/548.pdf
      SHA256_DIGEST_LENGTH,
      HashAlgorithmAesCrypto.Sha512
    );
  };

  generateIv = async (size) =>
  // Naming isn't perfect here, but this is how the library generates random IV (and encodes it the right way)
  // See: https://www.npmjs.com/package/react-native-aes-crypto#example
  await Aes.randomKey(size);

  encrypt = async (data, key, iv) =>
  await Aes.encrypt(data, key, iv, CipherAlgorithmAesCrypto.Cbc);

  decrypt = async (data, key, iv) =>
  await Aes.decrypt(data, key, iv, CipherAlgorithmAesCrypto.Cbc);
}

/**
 * @deprecated This class is deprecated and will be removed in future versions.
 * Please use `QuickCryptoEncryptionLibrary` instead.
 */
class AesForkedEncryptionLibrary {
  deriveKey = async (
  password,
  salt,
  opts) =>
  {
    assertIsKdfAlgorithm(opts.algorithm);

    // This library was mainly used in a legacy context, meaning the number of iterations/rounds during the
    // key derivation was hard-coded in the native library itself. We do check for those here to make sure
    // the caller is aware of this
    const legacyIterations = LEGACY_DERIVATION_OPTIONS.params.iterations;
    if (opts.params.iterations !== legacyIterations) {
      throw new Error(
        `Invalid number of iterations, should be: ${legacyIterations}`
      );
    }

    return await AesForked.pbkdf2(password, salt);
  };

  generateIv = async (size) =>
  // NOTE: For some reason, we are not using the AesForked one here, so keep the previous behavior!
  // Naming isn't perfect here, but this is how the library generates random IV (and encodes it the right way)
  // See: https://www.npmjs.com/package/react-native-aes-crypto#example
  await Aes.randomKey(size);

  encrypt = async (data, key, iv) =>
  // NOTE: For some reason, we are not using the AesForked one here, so keep the previous behavior!
  await Aes.encrypt(data, key, iv);

  decrypt = async (data, key, iv) =>
  await AesForked.decrypt(data, key, iv);
}

// Those wrappers are stateless, we can build them only once!

/**
 * @deprecated - This class is deprecated and will be removed in future versions.
 */
export const AesLib = new AesEncryptionLibrary();
/**
 * @deprecated - This class is deprecated and will be removed in future versions.
 */
export const AesForkedLib = new AesForkedEncryptionLibrary();