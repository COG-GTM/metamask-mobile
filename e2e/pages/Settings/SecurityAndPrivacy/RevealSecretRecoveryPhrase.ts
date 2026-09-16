import {
  RevealSeedViewSelectorsIDs,
  RevealSeedViewSelectorsText,
} from '../../../selectors/Settings/SecurityAndPrivacy/RevealSeedView.selectors';
import Matchers from '../../../utils/Matchers';
import Gestures from '../../../utils/Gestures';

class RevealSecretRecoveryPhrase {
  get container() {
    return Matchers.getElementByID(
      RevealSeedViewSelectorsIDs.REVEAL_CREDENTIAL_CONTAINER_ID,
    );
  }

  get passwordWarning() {
    return Matchers.getElementByID(
      RevealSeedViewSelectorsIDs.PASSWORD_WARNING_ID,
    );
  }

  get passwordInputToRevealCredential() {
    return Matchers.getElementByID(
      RevealSeedViewSelectorsIDs.PASSWORD_INPUT_BOX_ID,
    );
  }

  get scrollViewIdentifier() {
    return Matchers.getIdentifier(
      RevealSeedViewSelectorsIDs.REVEAL_CREDENTIAL_SCROLL_ID,
    );
  }

  get revealSecretRecoveryPhraseButton() {
    return Matchers.getElementByID(
      RevealSeedViewSelectorsIDs.REVEAL_CREDENTIAL_BUTTON_ID,
    );
  }

  get revealCredentialCopyToClipboardButton() {
    return Matchers.getElementByID(
      RevealSeedViewSelectorsIDs.REVEAL_CREDENTIAL_COPY_TO_CLIPBOARD_BUTTON,
    );
  }

  get revealCredentialQRCodeTab() {
    return Matchers.getElementByText(
      RevealSeedViewSelectorsText.REVEAL_CREDENTIAL_QR_CODE_TAB_ID,
    );
  }

  get revealCredentialQRCodeImage() {
    return Matchers.getElementByID(
      RevealSeedViewSelectorsIDs.REVEAL_CREDENTIAL_QR_CODE_IMAGE_ID,
    );
  }

  get doneButton() {
    return Matchers.getElementByText(
      RevealSeedViewSelectorsText.REVEAL_CREDENTIAL_DONE,
    );
  }

  async enterPasswordToRevealSecretCredential(password: string) {
    await Gestures.typeTextAndHideKeyboard(
      this
        .passwordInputToRevealCredential as Promise<Detox.IndexableNativeElement>,
      password,
    );
  }

  async tapToReveal() {
    await Gestures.waitAndTap(this.revealSecretRecoveryPhraseButton);
  }

  async tapToCopyCredentialToClipboard() {
    await Gestures.tap(
      this
        .revealCredentialCopyToClipboardButton as Promise<Detox.IndexableNativeElement>,
    );
  }

  async tapToRevealPrivateCredentialQRCode() {
    await Gestures.tap(
      this.revealCredentialQRCodeTab as Promise<Detox.IndexableNativeElement>,
    );
  }

  async scrollToDone() {
    await Gestures.scrollToElement(
      this.doneButton as Promise<Detox.IndexableNativeElement>,
      this.scrollViewIdentifier,
    );
  }

  async tapDoneButton() {
    return Gestures.waitAndTap(this.doneButton);
  }
}

export default new RevealSecretRecoveryPhrase();
