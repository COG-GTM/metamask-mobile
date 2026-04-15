import { AesLib, AesForkedLib } from './aes-native';
import { QuickCryptoLib } from './quick-crypto';
import { ENCRYPTION_LIBRARY } from '../constants';


function getEncryptionLibrary(
lib)
{
  switch (lib) {
    case ENCRYPTION_LIBRARY.original:
      return AesLib;
    case ENCRYPTION_LIBRARY.quickCrypto:
      return QuickCryptoLib;
    default:
      return AesForkedLib;
  }
}

export {
  AesLib,
  AesForkedLib,
  QuickCryptoLib,
  getEncryptionLibrary };