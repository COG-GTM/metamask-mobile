import {
  aesCryptoFormInputs,
  aesCryptoFormResponses,
  aesCryptoFormButtons,
  aesCryptoFormScrollIdentifier,
  accountAddress,
} from '../../selectors/Settings/AesCrypto.selectors';
import Matchers from '../../utils/Matchers';
import Gestures from '../../utils/Gestures';

class AesCryptoTestForm {
  get scrollViewIdentifier() {
    return Matchers.getIdentifier(aesCryptoFormScrollIdentifier);
  }

  // Get account address
  get accountAddress() {
    return Matchers.getElementByID(accountAddress);
  }

  // Generate salt getters
  get generateSaltBytesCountInput() {
    return Matchers.getElementByID(aesCryptoFormInputs.saltBytesCountInput);
  }
  get generateSaltResponse() {
    return Matchers.getElementByID(aesCryptoFormResponses.saltResponse);
  }
  get generateSaltButton() {
    return Matchers.getElementByID(aesCryptoFormButtons.generateSaltButton);
  }

  // Generate encryption key from password getters
  get generateEncryptionKeyPasswordInput() {
    return Matchers.getElementByID(aesCryptoFormInputs.passwordInput);
  }
  get generateEncryptionKeySaltInput() {
    return Matchers.getElementByID(
      aesCryptoFormInputs.saltInputForEncryptionKey,
    );
  }
  get generateEncryptionKeyResponse() {
    return Matchers.getElementByID(
      aesCryptoFormResponses.generateEncryptionKeyResponse,
    );
  }
  get generateEncryptionKeyButton() {
    return Matchers.getElementByID(
      aesCryptoFormButtons.generateEncryptionKeyButton,
    );
  }

  // Encrypt getters
  get encryptDataInput() {
    return Matchers.getElementByID(aesCryptoFormInputs.dataInputForEncryption);
  }
  get encryptPasswordInput() {
    return Matchers.getElementByID(
      aesCryptoFormInputs.passwordInputForEncryption,
    );
  }
  get encryptResponse() {
    return Matchers.getElementByID(aesCryptoFormResponses.encryptionResponse);
  }
  get encryptButton() {
    return Matchers.getElementByID(aesCryptoFormButtons.encryptButton);
  }

  // Decrypt getters
  get decryptPasswordInput() {
    return Matchers.getElementByID(
      aesCryptoFormInputs.passwordInputForDecryption,
    );
  }
  get decryptResponse() {
    return Matchers.getElementByID(aesCryptoFormResponses.decryptionResponse);
  }
  get decryptButton() {
    return Matchers.getElementByID(aesCryptoFormButtons.decryptButton);
  }

  // Encrypt with key getters
  get encryptWithKeyEncryptionKeyInput() {
    return Matchers.getElementByID(
      aesCryptoFormInputs.encryptionKeyInputForEncryptionWithKey,
    );
  }
  get encryptWithKeyDataInput() {
    return Matchers.getElementByID(
      aesCryptoFormInputs.dataInputForEncryptionWithKey,
    );
  }
  get encryptWithKeyResponse() {
    return Matchers.getElementByID(
      aesCryptoFormResponses.encryptionWithKeyResponse,
    );
  }
  get encryptWithKeyButton() {
    return Matchers.getElementByID(aesCryptoFormButtons.encryptWithKeyButton);
  }

  // Decrypt with key getters
  get decryptWithKeyEncryptionKeyInput() {
    return Matchers.getElementByID(
      aesCryptoFormInputs.encryptionKeyInputForDecryptionWithKey,
    );
  }
  get decryptWithKeyResponse() {
    return Matchers.getElementByID(
      aesCryptoFormResponses.decryptionWithKeyResponse,
    );
  }
  get decryptWithKeyButton() {
    return Matchers.getElementByID(aesCryptoFormButtons.decryptWithKeyButton);
  }

  async scrollUpToGenerateSalt() {
    await Gestures.scrollToElement(
      this.generateSaltBytesCountInput as Promise<Detox.IndexableNativeElement>,
      this.scrollViewIdentifier,
      'up',
    );
  }

  async scrollUpToGenerateEncryptionKey() {
    await Gestures.scrollToElement(
      this
        .generateEncryptionKeyPasswordInput as Promise<Detox.IndexableNativeElement>,
      this.scrollViewIdentifier,
      'up',
    );
  }

  async scrollToEncrypt() {
    await Gestures.scrollToElement(
      this.encryptButton as Promise<Detox.IndexableNativeElement>,
      this.scrollViewIdentifier,
    );
  }

  async scrollToDecrypt() {
    await Gestures.scrollToElement(
      this.decryptButton as Promise<Detox.IndexableNativeElement>,
      this.scrollViewIdentifier,
    );
  }

  async scrollToEncryptWithKey() {
    await Gestures.scrollToElement(
      this.encryptWithKeyButton as Promise<Detox.IndexableNativeElement>,
      this.scrollViewIdentifier,
    );
  }

  async scrollToDecryptWithKey() {
    await Gestures.scrollToElement(
      this.decryptWithKeyButton as Promise<Detox.IndexableNativeElement>,
      this.scrollViewIdentifier,
    );
  }

  async generateSalt(saltBytesCount: string) {
    await this.scrollUpToGenerateSalt();
    await Gestures.typeTextAndHideKeyboard(
      this.generateSaltBytesCountInput as Promise<Detox.IndexableNativeElement>,
      saltBytesCount,
    );
    await Gestures.waitAndTap(this.generateSaltButton);

    const responseFieldAtts = await (
      await this.generateSaltResponse
    ).getAttributes();

    // @ts-expect-error - the label property does exist in this object.
    return responseFieldAtts.label;
  }

  async generateEncryptionKey(password: string, salt: string) {
    await this.scrollUpToGenerateEncryptionKey();
    await Gestures.typeTextAndHideKeyboard(
      this
        .generateEncryptionKeyPasswordInput as Promise<Detox.IndexableNativeElement>,
      password,
    );
    await Gestures.typeTextAndHideKeyboard(
      this
        .generateEncryptionKeySaltInput as Promise<Detox.IndexableNativeElement>,
      salt,
    );
    await Gestures.waitAndTap(this.generateEncryptionKeyButton);
    await Gestures.waitAndTap(this.generateEncryptionKeyResponse);

    const responseFieldAtts = await (
      await this.generateEncryptionKeyResponse
    ).getAttributes();

    // @ts-expect-error - the label property does exist in this object.
    return responseFieldAtts.label;
  }

  async encrypt(data: string, encryptionKey: string) {
    await this.scrollToEncrypt();
    await Gestures.typeTextAndHideKeyboard(
      this.encryptDataInput as Promise<Detox.IndexableNativeElement>,
      data,
    );
    await Gestures.typeTextAndHideKeyboard(
      this.encryptPasswordInput as Promise<Detox.IndexableNativeElement>,
      encryptionKey,
    );
    await Gestures.waitAndTap(this.encryptButton);
  }

  async decrypt(encryptionKey: string) {
    await this.scrollToDecrypt();
    await Gestures.typeTextAndHideKeyboard(
      this.decryptPasswordInput as Promise<Detox.IndexableNativeElement>,
      encryptionKey,
    );
    await this.scrollToDecrypt();
    await Gestures.waitAndTap(this.decryptButton);
  }

  async encryptWithKey(encryptionKey: string, data: string) {
    await this.scrollToEncryptWithKey();
    await Gestures.typeTextAndHideKeyboard(
      this
        .encryptWithKeyEncryptionKeyInput as Promise<Detox.IndexableNativeElement>,
      encryptionKey,
    );
    await Gestures.typeTextAndHideKeyboard(
      this.encryptWithKeyDataInput as Promise<Detox.IndexableNativeElement>,
      data,
    );
    await Gestures.waitAndTap(this.encryptWithKeyButton);
  }

  async decryptWithKey(encryptionKey: string) {
    await this.scrollToDecryptWithKey();
    await Gestures.typeTextAndHideKeyboard(
      this
        .decryptWithKeyEncryptionKeyInput as Promise<Detox.IndexableNativeElement>,
      encryptionKey,
    );
    await Gestures.waitAndTap(this.decryptWithKeyButton);
  }
}

export default new AesCryptoTestForm();
