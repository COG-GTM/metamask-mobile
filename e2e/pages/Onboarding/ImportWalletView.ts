import { ChoosePasswordSelectorsIDs } from '../../selectors/Onboarding/ChoosePassword.selectors';
import { ImportFromSeedSelectorsIDs } from '../../selectors/Onboarding/ImportFromSeed.selectors';
import Matchers from '../../utils/Matchers';
import Gestures from '../../utils/Gestures';

class ImportWalletView {
  get container() {
    return Matchers.getElementByID(ImportFromSeedSelectorsIDs.CONTAINER_ID);
  }

  get newPasswordInput() {
    return Matchers.getElementByID(
      ChoosePasswordSelectorsIDs.NEW_PASSWORD_INPUT_ID,
    );
  }

  get confirmPasswordInput() {
    return Matchers.getElementByID(
      ChoosePasswordSelectorsIDs.CONFIRM_PASSWORD_INPUT_ID,
    );
  }

  get seedPhraseInput() {
    return Matchers.getElementByID(
      ImportFromSeedSelectorsIDs.SEED_PHRASE_INPUT_ID,
    );
  }

  async enterPassword(password: string) {
    await Gestures.typeTextAndHideKeyboard(this.newPasswordInput, password);
  }

  async reEnterPassword(password: string) {
    await Gestures.typeTextAndHideKeyboard(this.confirmPasswordInput, password);
  }

  async enterSecretRecoveryPhrase(secretRecoveryPhrase: string) {
    await Gestures.typeTextAndHideKeyboard(
      this.seedPhraseInput,
      secretRecoveryPhrase,
    );
  }
  async clearSecretRecoveryPhraseInputBox() {
    await Gestures.clearField(this.seedPhraseInput);
  }
}

export default new ImportWalletView();
