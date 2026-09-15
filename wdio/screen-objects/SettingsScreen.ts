import Selectors from '../helpers/Selectors';
import { LOCK_SETTINGS } from './testIDs/Screens/Settings.testIds';
import Gestures from '../helpers/Gestures';
import { SettingsViewSelectorsIDs } from '../../e2e/selectors/Settings/SettingsView.selectors';

class SettingsScreen {
  get lockOption() {
    return Selectors.getElementByPlatform(LOCK_SETTINGS);
  }

  get generalSettings() {
    return Selectors.getXpathElementByResourceId(
      SettingsViewSelectorsIDs.GENERAL,
    );
  }

  async waitForDisplay() {
    const element = (await this.generalSettings) as WebdriverIO.Element;
    await element.waitForDisplayed();
  }

  async tapLockOption() {
    const lockOption = (await this.lockOption) as WebdriverIO.Element;
    while (!(await lockOption.isDisplayed())) {
      await Gestures.swipeUp();
    }

    await Gestures.waitAndTap(lockOption);
  }
}

export default new SettingsScreen();
