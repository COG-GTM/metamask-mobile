class Selectors {
  static async getElementByPlatform(
    id: string,
    isNested = false,
  ): Promise<WebdriverIO.Element> {
    if (!isNested) {
      return $(`~${id}`);
    }

    const platform = await driver.getPlatform();
    if (platform === 'Android') {
      return $(`~${id}`);
    } else if (platform === 'iOS') {
      /**
       * Use class chains for iOS
       * Ref.: https://webdriver.io/docs/selectors#ios-uiautomation
       * Too many levels of nesting cause test ids not to be rendered
       * Ref.: https://github.com/appium/appium/issues/14825
       */
      return $(`-ios class chain:${id}`);
    }
    throw new Error(`Unsupported platform: ${platform}`);
  }

  static async getXpathByContentDesc(id: string) {
    return driver.$$(`//*[@content-desc='${id}']`);
  }

  static async getXpathElementByText(
    text: string,
  ): Promise<WebdriverIO.Element> {
    const platform = await driver.getPlatform();
    if (platform === 'iOS') {
      return await $(`//*[@name='${text}']`);
    }

    if (platform === 'Android') {
      return await $(`//*[@text='${text}']`);
    }
    throw new Error(`Unsupported platform: ${platform}`);
  }

  static async getXpathElementByTextContains(
    text: string,
  ): Promise<WebdriverIO.Element> {
    const platform = await driver.getPlatform();
    if (platform === 'iOS') {
      return await $(`//*[contains(@name, '${text}')]`);
    }

    if (platform === 'Android') {
      return await $(`//*[contains(@text, '${text}')]`);
    }
    throw new Error(`Unsupported platform: ${platform}`);
  }

  static async getXpathElementByResourceId(
    id: string,
  ): Promise<WebdriverIO.Element> {
    const platform = await driver.getPlatform();
    if (platform === 'iOS') {
      return await $(`~${id}`);
    }

    if (platform === 'Android') {
      return await $(`//*[@resource-id='${id}']`);
    }
    throw new Error(`Unsupported platform: ${platform}`);
  }

  static async getElementByCss(css: string) {
    return await $(css);
  }
}

export default Selectors;
