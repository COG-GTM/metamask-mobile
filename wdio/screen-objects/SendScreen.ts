import Gestures from '../helpers/Gestures';
import Selectors from '../helpers/Selectors';
import {
  ADD_ADDRESS_BUTTON,
  AMOUNT_SCREEN,
  SEND_ADDRESS_INPUT_FIELD,
  SEND_CANCEL_BUTTON,
  SEND_SCREEN_ID,
  SEND_WARNING_MESSAGE,
  UNDERSTAND_WARNING_CONTINUE,
} from './testIDs/Screens/SendScreen.testIds';
import { TRANSACTION_AMOUNT_INPUT } from './testIDs/Screens/AmountScreen.testIds';
import { CONFIRM_TXN_AMOUNT } from './testIDs/Screens/TransactionConfirm.testIds';

class SendScreen {
  get container() {
    return Selectors.getElementByPlatform(SEND_SCREEN_ID);
  }

  get sendAddressInputField() {
    return Selectors.getElementByPlatform(SEND_ADDRESS_INPUT_FIELD);
  }

  get sendWarningMessage() {
    return Selectors.getElementByPlatform(SEND_WARNING_MESSAGE);
  }

  get sendCancelButton() {
    return Selectors.getElementByPlatform(SEND_CANCEL_BUTTON);
  }

  get amountInputField() {
    return Selectors.getElementByPlatform(TRANSACTION_AMOUNT_INPUT);
  }

  get understandWarningcontinue() {
    return Selectors.getElementByPlatform(UNDERSTAND_WARNING_CONTINUE);
  }

  get amountScreen() {
    return Selectors.getElementByPlatform(AMOUNT_SCREEN);
  }

  get confirmAmount() {
    return Selectors.getElementByPlatform(CONFIRM_TXN_AMOUNT);
  }

  get addAddressButton() {
    return Selectors.getElementByPlatform(ADD_ADDRESS_BUTTON);
  }

  async typeAddressInSendAddressField(address: string) {
    await Gestures.typeText(this.sendAddressInputField, address);
  }

  async isSendWarningMessageVisible(message: string) {
    expect(await Selectors.getXpathElementByText(message)).toBeDisplayed();
  }

  async isTextVisible(message: string) {
    expect(await Selectors.getXpathElementByText(message)).toBeDisplayed();
  }

  async isContinueTextVisible() {
    await expect(this.understandWarningcontinue).toBeDisplayed();
  }

  async tapAddAddressButton() {
    await Gestures.waitAndTap(this.addAddressButton);
  }

  async tapCancelButton() {
    await Gestures.waitAndTap(this.sendCancelButton);
  }

  async isAmountScreenDisplayed() {
    const amountScreen = await this.amountScreen;
    await amountScreen.waitForDisplayed();
  }

  async isChangedContactNameVisible(contactName: string) {
    expect(await Selectors.getXpathElementByText(contactName)).toBeDisplayed();
  }

  async isContactNameVisible(contact: string) {
    expect(await Selectors.getXpathElementByText(contact)).toBeDisplayed();
  }

  async isDeletedContactNameNotVisible(contact: string) {
    expect(await Selectors.getXpathElementByText(contact)).not.toBeDisplayed();
  }

  async waitForDisplayed() {
    const screen = await this.container;
    await screen.waitForDisplayed();
  }
}

export default new SendScreen();
