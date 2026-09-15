import Selectors from '../helpers/Selectors';

class ActivityScreen {

  async isTransactionDisplayed(text: string) {
    await expect(Selectors.getXpathElementByText(text)).toBeDisplayed();
  }
}

export default new ActivityScreen();
