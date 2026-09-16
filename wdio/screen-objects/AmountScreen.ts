import Gestures from '../helpers/Gestures';
import Selectors from '../helpers/Selectors';
import {
  AMOUNT_ERROR,
  AMOUNT_SCREEN,
  NEXT_BUTTON,
  TRANSACTION_AMOUNT_INPUT,
} from './testIDs/Screens/AmountScreen.testIds';
import { CONFIRM_TXN_AMOUNT } from './testIDs/Screens/TransactionConfirm.testIds';

class AmountScreen {
  get amountInputField() {
    return Selectors.getElementByPlatform(TRANSACTION_AMOUNT_INPUT);
  }

  get confirmAmount() {
    return Selectors.getElementByPlatform(CONFIRM_TXN_AMOUNT);
  }

  get amountScreen() {
    return Selectors.getElementByPlatform(AMOUNT_SCREEN);
  }

  get amountError() {
    return Selectors.getElementByPlatform(AMOUNT_ERROR);
  }

  get nextButton() {
    return Selectors.getElementByPlatform(NEXT_BUTTON);
  }

  async enterAmount(text: string) {
    await Gestures.waitAndTap(this.amountInputField);
    await Gestures.typeText(this.amountInputField, text);
  }

  async isTokenCorrect(token: string) {
    expect(this.confirmAmount).toHaveText(token);
  }

  async waitForAmountErrorMessage() {
    const amountError = await this.amountError;
    await amountError.waitForDisplayed();
  }

  async waitNextButtonEnabled() {
    const nextButton = await this.nextButton;
    await nextButton.waitForEnabled();
  }
}

export default new AmountScreen();
