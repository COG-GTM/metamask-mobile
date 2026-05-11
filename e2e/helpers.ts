import { waitFor, web, expect as detoxExpect } from 'detox';
import {
  getFixturesServerPort,
  getGanachePort,
  getLocalTestDappPort,
  getMockServerPort,
} from './fixtures/utils';
import Utilities from './utils/Utilities';
import { resolveConfig } from 'detox/internals';

interface Point {
  x: number;
  y: number;
}

type LaunchAppOptions = Parameters<Detox.Device['launchApp']>[0];

export default class TestHelpers {
  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async waitAndTap(
    elementId: string,
    timeout?: number,
    index?: number,
  ): Promise<void> {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(timeout || 8000);

    await element(by.id(elementId))
      .atIndex(index || 0)
      .tap();
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async waitAndTapText(text: string, timeout?: number): Promise<void> {
    await waitFor(element(by.text(text)))
      .toBeVisible()
      .withTimeout(timeout || 8000);

    await element(by.text(text)).tap();
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static tap(elementId: string): Promise<void> {
    return element(by.id(elementId)).tap();
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static tapByDescendentTestID(
    parentElement: string,
    ChildElement: string,
  ): Promise<void> {
    return element(
      by.id(parentElement).withDescendant(by.id(ChildElement)),
    ).tap();
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static tapByText(text: string, index?: number): Promise<void> {
    return element(by.text(text))
      .atIndex(index || 0)
      .tap();
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static doubleTapByText(text: string, index?: number): Promise<void> {
    return element(by.text(text))
      .atIndex(index || 0)
      .multiTap(2);
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static tapAtPoint(elementId: string, point: Point): Promise<void> {
    return element(by.id(elementId)).tap(point);
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static tapItemAtIndex(elementID: string, index?: number): Promise<void> {
    return element(by.id(elementID))
      .atIndex(index || 0)
      .tap();
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static tapItemAtIndexByLabel(
    elementID: string,
    index?: number,
  ): Promise<void> {
    return element(by.label(elementID))
      .atIndex(index || 0)
      .tap();
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async typeText(elementId: string, text: string): Promise<void> {
    await TestHelpers.tap(elementId);
    await element(by.id(elementId)).typeText(text);
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async typeNumbers(
    elementId: string,
    text: string,
    submitLabel: string,
  ): Promise<void> {
    await element(by.id(elementId)).replaceText(text.replace('\n', ''));
    await element(by.label(submitLabel)).atIndex(0).tap();
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async typeTextAndHideKeyboard(
    elementId: string,
    text: string,
  ): Promise<void> {
    if (device.getPlatform() === 'android') {
      await TestHelpers.clearField(elementId);
    }
    await TestHelpers.typeText(elementId, text + '\n');
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async clearField(elementId: string): Promise<void> {
    await element(by.id(elementId)).replaceText('');
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async tapAndLongPress(elementId: string): Promise<void> {
    await TestHelpers.tap(elementId);
    await element(by.id(elementId)).longPress(2000);
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async tapAndLongPressAtIndex(
    elementId: string,
    index?: number,
  ): Promise<void> {
    await element(by.id(elementId))
      .atIndex(index || 0)
      .longPress(2000);
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async replaceTextInField(
    elementId: string,
    text: string,
  ): Promise<void> {
    await element(by.id(elementId)).replaceText(text);
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static tapAlertWithButton(text: string, index?: number): Promise<void> {
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
  ): Promise<void> {
    await waitFor(element(by.label(text)))
      .toBeVisible()
      .withTimeout(timeout || 15000);

    await element(by.label(text))
      .atIndex(index || 0)
      .tap();
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async tapWebviewElement(elementId: string): Promise<void> {
    // this method only words on android: https://wix.github.io/Detox/docs/api/webviews/
    await web.element(by.web.id(elementId)).tap();
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
  ): Promise<void> {
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
  ): Promise<void> {
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
  ): Promise<void> {
    await element(by.text(text)).atIndex(0).swipe(direction, speed, percentage);
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async scrollTo(
    scrollViewId: string,
    edge: Detox.Direction,
  ): Promise<void> {
    await element(by.id(scrollViewId)).scrollTo(edge);
  }

  /**
   * @deprecated Use Guestures Class to accomplish this.
   */
  static async scrollUpTo(
    elementId: string,
    distance: number,
    direction: Detox.Direction,
  ): Promise<void> {
    await element(by.id(elementId)).scroll(distance, direction);
  }

  static async openDeepLink(inputURL: string): Promise<void> {
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
  static async checkIfVisible(elementId: string): Promise<void> {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(15000);
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfNotVisible(elementId: string): Promise<void> {
    await waitFor(element(by.id(elementId)))
      .not.toBeVisible()
      .withTimeout(10000);
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfElementWithTextIsNotVisible(text: string): Promise<void> {
    await detoxExpect(element(by.text(text)).atIndex(0)).not.toBeVisible();
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfElementNotToHaveText(
    elementId: string,
    text: string,
  ): Promise<void> {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(10000);

    await detoxExpect(element(by.id(elementId))).not.toHaveText(text);
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfExists(elementId: string): Promise<void> {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(10000);
    await detoxExpect(element(by.id(elementId))).toExist();
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfHasText(elementId: string, text: string): Promise<void> {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(10000);

    await detoxExpect(element(by.id(elementId))).toHaveText(text);
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfElementWithTextIsVisible(
    text: string,
    index?: number,
  ): Promise<void> {
    await waitFor(element(by.text(text)).atIndex(index || 0))
      .toBeVisible()
      .withTimeout(10000);
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfElementByTextIsVisible(
    text: string,
    timeout: number = 25000,
  ): Promise<void> {
    await waitFor(element(by.text(text)))
      .toBeVisible()
      .withTimeout(timeout);
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async checkIfElementHasString(
    elementID: string,
    text: string,
  ): Promise<void> {
    // toString is unusual on a Detox element; preserved for legacy callers.
    // Cast through unknown to avoid forcing the call into the wrong signature.
    const matcher = detoxExpect(element(by.id(elementID))) as unknown as {
      toString(s: string): Promise<void>;
    };
    await matcher.toString(text);
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static checkIfToggleIsOn(elementID: string): Promise<void> {
    return detoxExpect(element(by.id(elementID))).toHaveToggleValue(true);
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static checkIfToggleIsOff(elementID: string): Promise<void> {
    return detoxExpect(element(by.id(elementID))).toHaveToggleValue(false);
  }

  static relaunchApp(): Promise<void> {
    return this.launchApp({
      newInstance: true,
      launchArgs: {
        detoxURLBlacklistRegex: Utilities.BlacklistURLs,
      },
    });
  }

  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });
  } // Detox has no waits for webview elements visibility. Here is the custom one.

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async waitForWebElementToBeVisibleById(
    elementId: string,
    timeout: number = 15000,
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        await detoxExpect(web.element(by.web.id(elementId))).toExist();
        return;
      } catch {
        // Element not found yet: waiting for 200ms
        await new Promise<void>((resolve) => setTimeout(resolve, 200));
      }
    }
    throw new Error('Element with ' + elementId + ' not found');
  }

  /**
   * @deprecated Use Assertion Class to accomplish this.
   */
  static async retry(
    maxAttempts: number,
    testLogic: () => Promise<void>,
  ): Promise<void> {
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

  static async reverseServerPort(): Promise<void> {
    if (device.getPlatform() === 'android') {
      await device.reverseTcpPort(getGanachePort());
      await device.reverseTcpPort(getFixturesServerPort());
      await device.reverseTcpPort(getLocalTestDappPort());
      await device.reverseTcpPort(getMockServerPort());
    }
  }

  static async launchApp(launchOptions?: LaunchAppOptions): Promise<void> {
    const config = await resolveConfig();
    const platform = device.getPlatform();
    if (config.configurationName.endsWith('debug')) {
      await this.launchAppForDebugBuild(platform, launchOptions);
      return;
    }

    await device.launchApp(launchOptions);
  }

  static async launchAppForDebugBuild(
    platform: 'ios' | 'android',
    launchOptions?: LaunchAppOptions,
  ): Promise<void> {
    const deepLinkUrl = this.getDeepLinkUrl(
      this.getDevLauncherPackagerUrl(platform),
    );

    if (platform === 'ios') {
      await device.launchApp(launchOptions);
      await device.openURL({
        url: deepLinkUrl,
      });
      return;
    }

    await device.launchApp({
      url: deepLinkUrl,
      ...launchOptions,
    });
  }

  static getDeepLinkUrl(url: string): string {
    return `expo-metamask://expo-development-client/?url=${encodeURIComponent(
      url,
    )}`;
  }

  static getDevLauncherPackagerUrl(platform: 'ios' | 'android'): string {
    return `http://localhost:8081/index.bundle?platform=${platform}&dev=true&minify=false&disableOnboarding=1`;
  }
}

