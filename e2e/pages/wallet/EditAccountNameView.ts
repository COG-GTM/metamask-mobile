import Matchers from '../../utils/Matchers';
import Gestures from '../../utils/Gestures';
import { EditAccountNameSelectorIDs } from '../../selectors/wallet/EditAccountName.selectors';

class EditAccountNameView {
  get saveButton() {
    return Matchers.getElementByID(
      EditAccountNameSelectorIDs.EDIT_ACCOUNT_NAME_SAVE,
    );
  }
  get accountNameInput() {
    return Matchers.getElementByID(
      EditAccountNameSelectorIDs.ACCOUNT_NAME_INPUT,
    );
  }

  async tapSave() {
    await Gestures.waitAndTap(this.saveButton);
  }

  async updateAccountName(accountName: string) {
    await Gestures.clearField(
      this.accountNameInput as Promise<Detox.IndexableNativeElement>,
    );
    await Gestures.typeTextAndHideKeyboard(
      this.accountNameInput as Promise<Detox.IndexableNativeElement>,
      accountName,
    );
  }
}

export default new EditAccountNameView();
