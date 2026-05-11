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
   * @returns Resolves to the located element
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
   *
   * @param text - Match elements with the specified text
   * @param index - Index of the element (default: 0)
   * @returns Resolves to the located element
   */
  static async getElementByText(
    text: string | RegExp,
    index: number = 0,
  ): Promise<Detox.NativeElement> {
    return element(by.text(text)).atIndex(index);
  }

  /**
   * Get element that match by id and label.
   * This strategy matches elements by combining 2 matchers together.
   * Elements returned match the provided ID and Label at the same time.
   *
   * @param id - Match elements with the specified id
   * @param label - Match elements with the specified label
   * @param index - Index of the element (default: 0)
   * @returns Resolves to the located element
   */
  static async getElementByIDAndLabel(
    id: string,
    label: string | RegExp,
    index: number = 0,
  ): Promise<Detox.NativeElement> {
    return element(by.id(id).and(by.label(label))).atIndex(index);
  }

  /**
   * Get element by label.
   *
   * @param label - Match elements with the specified accessibility label (iOS) or content description (Android)
   * @param index - Index of the element (default: 0)
   * @returns Resolves to the located element
   */
  static async getElementByLabel(
    label: string | RegExp,
    index: number = 0,
  ): Promise<Detox.NativeElement> {
    return element(by.label(label)).atIndex(index);
  }

  /**
   * Get element by descendant.
   *
   * @param parentElement - Matches elements with at least one descendant that matches the specified matcher.
   * @param childElement - The ID of the child element to locate within the parent element.
   * @returns Resolves to the located element
   */
  static async getElementByDescendant(
    parentElement: string,
    childElement: string,
  ): Promise<Detox.IndexableNativeElement> {
    return element(by.id(parentElement).withDescendant(by.id(childElement)));
  }

  /**
   * Get element with ancestor.
   *
   * @param childElement - The ID of the child element to locate within the parent element.
   * @param parentElement - Matches elements with at least one descendant that matches the specified matcher.
   * @returns Resolves to the located element
   */
  static async getElementIDWithAncestor(
    childElement: string,
    parentElement: string,
  ): Promise<Detox.IndexableNativeElement> {
    return element(by.id(childElement).withAncestor(by.id(parentElement)));
  }

  /**
   * Get Native WebView instance by elementId
   *
   * Because Android Webview might have more that one WebView instance present on the main activity, the correct element
   * is select based on its parent element id.
   * @param elementId The web ID of the browser webview
   * @returns WebView element
   */
  static getWebViewByID(elementId: string): Detox.WebViewElement {
    return device.getPlatform() === 'ios'
      ? web(by.id(elementId))
      : web(by.type('android.webkit.WebView').withAncestor(by.id(elementId)));
  }

  /**
   * Get element by web ID.
   *
   * @param webviewID - The web ID of the inner element to locate within the webview
   * @param innerID - The web ID of the browser webview
   * @returns Resolves to the located element
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
   * @param webviewID - The web ID of the browser webview
   * @param selector - CSS selector to locate the element
   * @returns Resolves to the located element
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
   * @param webviewID - The web ID of the browser webview
   * @param xpath - XPath expression to locate the element
   * @returns Resolves to the located element
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
   * @param webviewID - The web ID of the browser webview
   * @param url - URL string to locate the element
   * @returns Resolves to the located element
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
   *
   * @param selectorString - The selector string for identifying the element
   * @returns A Detox matcher that identifies elements by the specified ID.
   *
   * @description
   * This method does not create an element but instead generates only a matcher.
   * The purpose is to create a matcher that can be used for identification purposes,
   * without performing any actions on the element.
   */
  static async getIdentifier(selectorString: string): Promise<Detox.NativeMatcher> {
    return by.id(selectorString);
  }

  /**
   * Get system dialogs in the system-level (e.g. permissions, alerts, etc.), by text.
   *
   * @param text - Match elements with the specified text
   * @returns Resolves to the located element
   */
  static async getSystemElementByText(
    text: string,
  ): Promise<Detox.IndexableSystemElement> {
    return system.element(by.system.label(text));
  }
}

export default Matchers;
