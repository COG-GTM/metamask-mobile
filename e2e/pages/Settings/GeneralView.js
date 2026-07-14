import Matchers from '../../utils/Matchers';
import Gestures from '../../utils/Gestures';
import {
  GeneralViewSelectorsIDs,
  GeneralViewSelectorsText,
} from '../../selectors/Settings/GeneralView.selectors';

class GeneralView {
  get themeSettingsButton() {
    return Matchers.getElementByText(GeneralViewSelectorsText.THEME_BUTTON_TEXT);
  }

  get themeSettingsScreen() {
    return Matchers.getElementByID(
      GeneralViewSelectorsIDs.THEME_SETTINGS_SCREEN,
    );
  }

  get scrollViewIdentifier() {
    return Matchers.getIdentifier(
      GeneralViewSelectorsIDs.GENERAL_SETTINGS_SCROLL,
    );
  }

  async scrollToThemeSettings() {
    await Gestures.scrollToElement(
      this.themeSettingsButton,
      this.scrollViewIdentifier,
    );
  }

  async tapThemeSettings() {
    await Gestures.waitAndTap(this.themeSettingsButton);
  }
}

export default new GeneralView();
