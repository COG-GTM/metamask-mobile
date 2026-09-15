import Selectors from '../../helpers/Selectors';
import { ToastSelectorsIDs } from '../../../e2e/selectors/wallet/ToastModal.selectors';

class NotificationModal {
  get title() {
    return Selectors.getElementByPlatform(ToastSelectorsIDs.NOTIFICATION_TITLE);
  }

  async waitForDisplay() {
    const element = (await this.title) as WebdriverIO.Element;
    await element.waitForDisplayed();
  }

  async waitForDisappear() {
    const element = (await this.title) as WebdriverIO.Element;
    await element.waitForExist({ reverse: true });
  }
}

export default new NotificationModal();
