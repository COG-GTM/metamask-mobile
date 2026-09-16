import { WalletViewSelectorsIDs } from '../../../e2e/selectors/wallet/WalletView.selectors';
import Selectors from '../../helpers/Selectors';
import Gestures from '../../helpers/Gestures';

class WalletAccountModal {
  get accountNameLabelText() {
    return Selectors.getXpathElementByResourceId(WalletViewSelectorsIDs.ACCOUNT_NAME_LABEL_TEXT);
  }

  get accountNameLabelInput() {
    return Selectors.getElementByPlatform(WalletViewSelectorsIDs.ACCOUNT_NAME_LABEL_INPUT);
  }

  get walletAccountOverview() {
    return Selectors.getXpathElementByResourceId(WalletViewSelectorsIDs.ACCOUNT_OVERVIEW);
  }

  async longPressAccountNameLabel() {
    await Gestures.longPress(this.accountNameLabelText, 1000);
  }

  async editAccountNameLabel(text: string) {
    await Gestures.typeText(this.accountNameLabelInput, text);
  }

  async isAccountNameLabelEditable() {
    await expect(this.accountNameLabelInput).toBeDisplayed();
  }

  async isAccountNameLabelEqualTo(expected: string) {
    await expect(this.accountNameLabelText).toHaveText(expected);
  }

  async isAccountInputLabelEqualTo(expected: string) {
    const textFromElement = await this.accountNameLabelInput;
    const accountName = await textFromElement.getText();
    await expect(accountName).toContain(expected);
  }

  async isAccountOverview() {
    await expect(await this.walletAccountOverview).toBeDisplayed();
  }
}

export default new WalletAccountModal();
