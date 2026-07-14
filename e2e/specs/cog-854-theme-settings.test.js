'use strict';
import { Regression } from '../tags';
import TestHelpers from '../helpers';
import SettingsView from '../pages/Settings/SettingsView';
import GeneralView from '../pages/Settings/GeneralView';
import FixtureBuilder from '../fixtures/fixture-builder';
import {
  loadFixture,
  startFixtureServer,
  stopFixtureServer,
} from '../fixtures/fixture-helper';
import { getFixturesServerPort } from '../fixtures/utils';
import FixtureServer from '../fixtures/fixture-server';
import { loginToApp } from '../viewHelper';
import TabBarComponent from '../pages/wallet/TabBarComponent';
import Assertions from '../utils/Assertions';
import { GeneralViewSelectorsText } from '../selectors/Settings/GeneralView.selectors';

const fixtureServer = new FixtureServer();

describe(Regression('Theme Settings'), () => {
  beforeAll(async () => {
    await TestHelpers.reverseServerPort();
    const fixture = new FixtureBuilder().build();
    await startFixtureServer(fixtureServer);
    await loadFixture(fixtureServer, { fixture });
    await TestHelpers.launchApp({
      launchArgs: { fixtureServerPort: `${getFixturesServerPort()}` },
    });
    await loginToApp();
  });

  afterAll(async () => {
    await stopFixtureServer(fixtureServer);
  });

  it('opens the Theme settings modal from General settings', async () => {
    await TabBarComponent.tapSettings();
    await SettingsView.tapGeneralSettings();

    await GeneralView.scrollToThemeSettings();
    await Assertions.checkIfVisible(GeneralView.themeSettingsButton);

    await GeneralView.tapThemeSettings();

    // The ThemeSettings modal should be visible with the theme options.
    await Assertions.checkIfVisible(GeneralView.themeSettingsScreen);
    await Assertions.checkIfTextIsDisplayed(
      GeneralViewSelectorsText.THEME_OS_OPTION,
    );
    await Assertions.checkIfTextIsDisplayed(
      GeneralViewSelectorsText.THEME_LIGHT_OPTION,
    );
    await Assertions.checkIfTextIsDisplayed(
      GeneralViewSelectorsText.THEME_DARK_OPTION,
    );

    await device.takeScreenshot('cog-854-theme-settings-modal');
  });
});
