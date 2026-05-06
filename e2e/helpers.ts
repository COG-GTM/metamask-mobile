import { waitFor, web, system } from 'detox';
import {
  getFixturesServerPort,
  getGanachePort,
  getLocalTestDappPort,
  getMockServerPort,
} from './fixtures/utils';
import Utilities from './utils/Utilities';
import { resolveConfig } from 'detox/internals';

export default class TestHelpers {
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async waitAndTap(elementId: string, timeout?: number, index?: number) {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(timeout || 8000);

    return element(by.id(elementId))
      .atIndex(index || 0)
      .tap();
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async waitAndTapText(text: string, timeout?: number) {
    await waitFor(element(by.text(text)))
      .toBeVisible()
      .withTimeout(timeout || 8000);

    return element(by.text(text)).tap();
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static tap(elementId: string) {
    return element(by.id(elementId)).tap();
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static tapByDescendentTestID(parentElement: string, ChildElement: string) {
    return element(
      by.id(parentElement).withDescendant(by.id(ChildElement)),
    ).tap();
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static tapByText(text: string, index?: number) {
    return element(by.text(text))
      .atIndex(index || 0)
      .tap();
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static doubleTapByText(text: string, index?: number) {
    return element(by.text(text))
      .atIndex(index || 0)
      .multiTap(2);
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static tapAtPoint(elementId: string, point: { x: number; y: number }) {
    return element(by.id(elementId)).tap(point);
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static tapItemAtIndex(elementID: string, index?: number) {
    return element(by.id(elementID))
      .atIndex(index || 0)
      .tap();
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static tapItemAtIndexByLabel(elementID: string, index?: number) {
    return element(by.label(elementID))
      .atIndex(index || 0)
      .tap();
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async typeText(elementId: string, text: string) {
    await TestHelpers.tap(elementId);
    return element(by.id(elementId)).typeText(text);
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async typeNumbers(
    elementId: string,
    text: string,
    submitLabel: string,
  ) {
    await element(by.id(elementId)).replaceText(text.replace('\n', ''));
    return element(by.label(submitLabel)).atIndex(0).tap();
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async typeTextAndHideKeyboard(elementId: string, text: string) {
    if (device.getPlatform() === 'android') {
      await TestHelpers.clearField(elementId);
    }
    await TestHelpers.typeText(elementId, text + '\n');
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async clearField(elementId: string) {
    return element(by.id(elementId)).replaceText('');
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async tapAndLongPress(elementId: string) {
    await TestHelpers.tap(elementId);
    return element(by.id(elementId)).longPress(2000);
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async tapAndLongPressAtIndex(elementId: string, index?: number) {
    return element(by.id(elementId))
      .atIndex(index || 0)
      .longPress(2000);
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async replaceTextInField(elementId: string, text: string) {
    return element(by.id(elementId)).replaceText(text);
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */

  static tapAlertWithButton(text: string, index?: number) {
    if (device.getPlatform() === 'android') {
      return element(by.text(text))
        .atIndex(index || 0)
        .tap();
    }

    return element(by.label(text)).atIndex(0).tap();
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async waitAndTapByLabel(
    text: string,
    timeout?: number,
    index?: number,
  ) {
    await waitFor(element(by.label(text)))
      .toBeVisible()
      .withTimeout(timeout || 15000);

    return element(by.label(text))
      .atIndex(index || 0)
      .tap();
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async tapWebviewElement(elementId: string) {
    // this method only words on android: https://wix.github.io/Detox/docs/api/webviews/
    return web.element(by.web.id(elementId)).tap();
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async swipe(
    elementId: string,
    direction: Detox.Direction,
    speed?: Detox.Speed,
    percentage?: number,
    xStart?: number,
    yStart?: number,
  ) {
    await element(by.id(elementId)).swipe(
      direction,
      speed,
      percentage,
      xStart,
      yStart,
    );
  }
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async swipeByLabel(
    elementId: string,
    direction: Detox.Direction,
    speed?: Detox.Speed,
    percentage?: number,
  ) {
    await element(by.label(elementId)).swipe(direction, speed, percentage);
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async swipeByText(
    text: string,
    direction: Detox.Direction,
    speed?: Detox.Speed,
    percentage?: number,
  ) {
    await element(by.text(text)).atIndex(0).swipe(direction, speed, percentage);
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async scrollTo(scrollViewId: string, edge: Detox.Direction) {
    await element(by.id(scrollViewId)).scrollTo(edge);
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async scrollUpTo(
    elementId: string,
    distance: number,
    direction: Detox.Direction,
  ) {
    await element(by.id(elementId)).scroll(distance, direction);
  }

  static async openDeepLink(inputURL: string) {
    await device.launchApp({
      newInstance: true,
      url: inputURL,
      sourceApp: 'io.metamask',
      launchArgs: {
        fixtureServerPort: `${getFixturesServerPort()}`,
        detoxURLBlacklistRegex: Utilities.BlacklistURLs,
      },
    });
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfVisible(elementId: string) {
    return await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(15000);
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfNotVisible(elementId: string) {
    return await waitFor(element(by.id(elementId)))
      .not.toBeVisible()
      .withTimeout(10000);
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfElementWithTextIsNotVisible(text: string) {
    return await expect(element(by.text(text)).atIndex(0)).not.toBeVisible();
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfElementNotToHaveText(elementId: string, text: string) {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(10000);

    return (expect(element(by.id(elementId))).not as unknown as { toHaveText: (t: string) => Promise<void> }).toHaveText(text);
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfExists(elementId: string) {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(10000);
    return (expect(element(by.id(elementId))) as unknown as { toExist: () => Promise<void> }).toExist();
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfHasText(elementId: string, text: string) {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(10000);

    return (expect(element(by.id(elementId))) as unknown as { toHaveText: (t: string) => Promise<void> }).toHaveText(text);
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfElementWithTextIsVisible(text: string, index?: number) {
    return await waitFor(element(by.text(text)).atIndex(index ?? 0))
      .toBeVisible()
      .withTimeout(10000);
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfElementByTextIsVisible(text: string, timeout = 25000) {
    return await waitFor(element(by.text(text)))
      .toBeVisible()
      .withTimeout(timeout);
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfElementHasString(elementID: string, text: string) {
    return expect(element(by.id(elementID))).toString();
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static checkIfToggleIsOn(elementID: string) {
    return (expect(element(by.id(elementID))) as unknown as { toHaveToggleValue: (v: boolean) => Promise<void> }).toHaveToggleValue(true);
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static checkIfToggleIsOff(elementID: string) {
    return (expect(element(by.id(elementID))) as unknown as { toHaveToggleValue: (v: boolean) => Promise<void> }).toHaveToggleValue(false);
  }

  static relaunchApp() {
    return this.launchApp({
      newInstance: true,
      launchArgs: {
        detoxURLBlacklistRegex: Utilities.BlacklistURLs,
      },
    });
  }

  static delay(ms: number) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });
  } // Detox has no waits for webview elements visibility. Here is the custom one.

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async waitForWebElementToBeVisibleById(elementId: string, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        await (expect(web.element(by.web.id(elementId))) as unknown as { toExist: () => Promise<void> }).toExist(); // Element found
        return;
      } catch {
        // Element not found yet: waiting for 200ms
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
    throw new Error('Element with ' + elementId + ' not found');
  }
  /**
   * @deprecated Use Assertion Class to accomplish this.
   */

  static async retry(maxAttempts: number, testLogic: () => Promise<void>) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await testLogic();
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        } else {
          // eslint-disable-next-line no-console
          console.log('Test attempt failed', {
            attempt,
            error,
          });
        }
      }
    }
  }

  static async reverseServerPort() {
    if (device.getPlatform() === 'android') {
      await device.reverseTcpPort(getGanachePort());
      await device.reverseTcpPort(getFixturesServerPort());
      await device.reverseTcpPort(getLocalTestDappPort());
      await device.reverseTcpPort(getMockServerPort());
    }
  }

  static async launchApp(launchOptions: Detox.DeviceLaunchAppConfig) {
    const config = await resolveConfig();
    const platform = device.getPlatform();
    if (config.configurationName.endsWith('debug')) {
      return this.launchAppForDebugBuild(platform, launchOptions);
    }

    return device.launchApp(launchOptions);
  }

  static async launchAppForDebugBuild(
    platform: 'ios' | 'android',
    launchOptions: Detox.DeviceLaunchAppConfig,
  ) {
    const deepLinkUrl = this.getDeepLinkUrl(
      this.getDevLauncherPackagerUrl(platform),
    );

    if (platform === 'ios') {
      await device.launchApp(launchOptions);
      return device.openURL({
        url: deepLinkUrl,
      });
    }

    return device.launchApp({
      url: deepLinkUrl,
      ...launchOptions,
    });
  }

  static getDeepLinkUrl(url: string) {
    return `expo-metamask://expo-development-client/?url=${encodeURIComponent(
      url,
    )}`;
  }

  static getDevLauncherPackagerUrl(platform: string) {
    return `http://localhost:8081/index.bundle?platform=${platform}&dev=true&minify=false&disableOnboarding=1`;
  }
}
