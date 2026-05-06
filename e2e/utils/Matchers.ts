import { web, system } from 'detox';

/**
 * Utility class for matching (locating) UI elements
 */
class Matchers {
  /**
   * Get element by ID.
   *
   * @param elementId - Match elements with the specified testID
   * @param index - Index of the element (default: 0)
   */
  static async getElementByID(
    elementId: string | RegExp,
    index?: number,
  ): Promise<Detox.IndexableNativeElement | Detox.NativeElement> {
    if (index !== undefined) {
      return element(by.id(elementId)).atIndex(index);
    }
    return element(by.id(elementId));
  }

  /**
   * Get element by text.
   */
  static async getElementByText(
    text: string | RegExp,
    index = 0,
  ): Promise<Detox.NativeElement> {
    return element(by.text(text)).atIndex(index);
  }

  /**
   * Get element that matches by id and label combined.
   */
  static async getElementByIDAndLabel(
    id: string | RegExp,
    label: string | RegExp,
    index = 0,
  ): Promise<Detox.NativeElement> {
    return element(by.id(id).and(by.label(label))).atIndex(index);
  }

  /**
   * Get element by label.
   */
  static async getElementByLabel(
    label: string | RegExp,
    index = 0,
  ): Promise<Detox.NativeElement> {
    return element(by.label(label)).atIndex(index);
  }

  /**
   * Get element by descendant.
   */
  static async getElementByDescendant(
    parentElement: string,
    childElement: string,
  ): Promise<Detox.IndexableNativeElement> {
    return element(by.id(parentElement).withDescendant(by.id(childElement)));
  }

  /**
   * Get element with ancestor.
   */
  static async getElementIDWithAncestor(
    childElement: string,
    parentElement: string,
  ): Promise<Detox.IndexableNativeElement> {
    return element(by.id(childElement).withAncestor(by.id(parentElement)));
  }

  /**
   * Get Native WebView instance by elementId.
   */
  static getWebViewByID(elementId: string): Detox.WebViewElement {
    return device.getPlatform() === 'ios'
      ? web(by.id(elementId))
      : web(by.type('android.webkit.WebView').withAncestor(by.id(elementId)));
  }

  /**
   * Get element by web ID.
   */
  static async getElementByWebID(
    webviewID: string,
    innerID: string,
  ): Promise<Detox.IndexableWebElement | Detox.SecuredWebElementFacade> {
    const myWebView = this.getWebViewByID(webviewID);
    return myWebView.element(by.web.id(innerID));
  }

  /**
   * Get element by CSS selector.
   */
  static async getElementByCSS(
    webviewID: string,
    selector: string,
  ): Promise<Detox.WebElement> {
    const myWebView = web(by.id(webviewID));
    return myWebView.element(by.web.cssSelector(selector)).atIndex(0);
  }

  /**
   * Get element by XPath.
   */
  static async getElementByXPath(
    webviewID: string,
    xpath: string,
  ): Promise<Detox.IndexableWebElement | Detox.SecuredWebElementFacade> {
    const myWebView = this.getWebViewByID(webviewID);
    return myWebView.element(by.web.xpath(xpath));
  }

  /**
   * Get element by href.
   */
  static async getElementByHref(
    webviewID: string,
    url: string,
  ): Promise<Detox.WebElement> {
    const myWebView = web(by.id(webviewID));
    return myWebView.element(by.web.href(url)).atIndex(0);
  }

  /**
   * Creates a Detox matcher for identifying an element by its ID.
   * This method does not create an element but instead generates only a matcher.
   */
  static async getIdentifier(selectorString: string): Promise<Detox.NativeMatcher> {
    return by.id(selectorString);
  }

  /**
   * Get system dialogs in the system-level (e.g. permissions, alerts, etc.) by text.
   */
  static async getSystemElementByText(
    text: string,
  ): Promise<Detox.IndexableSystemElement> {
    return system.element(by.system.label(text));
  }
}

export default Matchers;
