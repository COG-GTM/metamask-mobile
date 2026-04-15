import { decrypt, encrypt, PrivateKey } from 'eciesjs';
import DevLogger from '../utils/DevLogger';

/**
 * These properties are optional and should only be used during development for debugging purposes.
 */





/**
 * Class that exposes methods to generate and compute
 * Elliptic Curve Integrated Encryption Scheme (ECIES) for key exchange and symmetric encryption/decryption
 *
 * It also exposes encryption/decryption methods that are used
 * by the communication layer to encrypt/decrypt in/out data
 * The encryption/decryption is made using a symmetric key generated from the ECIES key exchange
 */
export class ECIES {


  enabled = true;

  constructor(props) {
    if (props?.pkey) {
      this.ecies = PrivateKey.fromHex(props.pkey);
    } else {
      this.ecies = new PrivateKey();
    }

    DevLogger.log(
      `[ECIES constructor()] initialized secret: `,
      this.ecies.toHex()
    );

    DevLogger.log(
      `[ECIES constructor()] initialized public: `,
      this.ecies.publicKey.toHex()
    );
    DevLogger.log(`[ECIES constructor()] init with`, this);
  }

  /**
   * Creates new ECIES instance
   *
   * @returns - Generates ECIES instance
   */
  generateECIES() {
    this.ecies = new PrivateKey();
  }

  /**
   * Returns ECIES instance public key
   *
   * @returns - public key in base64 format
   */
  getPublicKey() {
    return this.ecies.publicKey.toHex();
  }

  /**
   * Encrypts a data message using the public key of the side to encrypt data for
   *
   * @param {string} data - data string to be encrypted
   * @param {string} otherPublicKey - public key of the side to encrypt data for
   * @returns - encrypted string in base64
   */
  encrypt(data, otherPublicKey) {
    let encryptedString = data;
    if (this.enabled) {
      try {
        DevLogger.log(
          `[ECIES: encrypt()] using otherPublicKey`,
          otherPublicKey
        );
        const payload = Buffer.from(data);
        const encryptedData = encrypt(otherPublicKey, payload);
        encryptedString = Buffer.from(encryptedData).toString('base64');
      } catch (err) {
        DevLogger.log(`[ECIES: encrypt()] error encrypt:`, err);
        DevLogger.log(`[ECIES: encrypt()] private: `, this.ecies.toHex());
        DevLogger.log('[ECIES: encrypt()] data: ', data);
        DevLogger.log(`[ECIES: encrypt()] otherkey: `, otherPublicKey);
        throw err;
      }
    }
    return encryptedString;
  }

  /**
   * Decrypts a data message using the instance private key
   *
   * @param {string} encryptedData - base64 data string to be decrypted
   * @returns - decrypted data || error message
   */
  decrypt(encryptedData) {
    let decryptedString = encryptedData;
    if (this.enabled) {
      try {
        DevLogger.log(
          `[ECIES: decrypt()] using privateKey`,
          this.ecies.toHex()
        );
        const payload = Buffer.from(encryptedData.toString(), 'base64');
        DevLogger.log(
          `[ECIES: decrypt()] encryptedData.toString()`,
          encryptedData.toString()
        );

        DevLogger.log(`[ECIES: decrypt()] Buffer.from`, payload);

        const decrypted = decrypt(this.ecies.toHex(), payload);
        DevLogger.log(`[ECIES: decrypt()] decrypt`);

        DevLogger.log(`[ECIES: decrypt()] decrypted.toString();`);
        decryptedString = decrypted.toString();
      } catch (error) {
        DevLogger.log(`[ECIES: decrypt()] error decrypt`, error);
        DevLogger.log(`[ECIES: decrypt()] private: `, this.ecies.toHex());
        DevLogger.log(`[ECIES: decrypt()] encryptedData: `, encryptedData);
        throw error;
      }
    }

    return decryptedString;
  }

  getKeyInfo() {
    return {
      private: this.ecies.toHex(),
      public: this.ecies.publicKey.toHex()
    };
  }

  toString() {
    DevLogger.log(`[ECIES: toString()]`, this.getKeyInfo());
  }
}