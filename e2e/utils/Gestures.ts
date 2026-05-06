import { waitFor } from 'detox';

type ElementInput<T> = T | Promise<T>;

/**
 * Class for handling user actions (Gestures)
 */
class Gestures {
  /**
   * Tap an element and long press.
   */
  static async tapAndLongPress(
    elementID: ElementInput<Detox.IndexableNativeElement | Detox.NativeElement>,
    timeout = 2000,
  ): Promise<void> {
    const el = await elementID;
    await el.longPress(timeout);
  }

  /**
   * Tap an element at a specific point.
   */
  static async tapAtPoint(
    elementID: ElementInput<Detox.IndexableNativeElement | Detox.NativeElement>,
    point: { x: number; y: number },
  ): Promise<void> {
    const el = await elementID;
    await el.tap(point);
  }

  /**
   * Wait for an element to be visible and then tap it.
   */
  static async tap(
    elementID: ElementInput<Detox.IndexableNativeElement | Detox.NativeElement>,
  ): Promise<void> {
    const el = await elementID;
    await el.tap();
  }

  /**
   * Tap an element with text partial text matching before tapping it.
   */
  static async tapTextBeginingWith(textPattern: string): Promise<void> {
    await element(by.text(new RegExp(`^/${textPattern} .*$/`))).tap();
  }

  /**
   * Wait for an element to be visible and then tap it.
   */
  static async waitAndTap(
    elementID: ElementInput<
      | Detox.IndexableNativeElement
      | Detox.NativeElement
      | Detox.SystemElement
      | Detox.IndexableSystemElement
    >,
    timeout = 15000,
  ): Promise<void> {
    const el = await elementID;
    await waitFor(el as Detox.NativeElement).toBeVisible().withTimeout(timeout);
    await el.tap();
  }

  /**
   * Wait for an element at a specific index to be visible and then tap it.
   */
  static async TapAtIndex(
    elementID: ElementInput<Detox.IndexableNativeElement>,
    index: number,
    timeout = 15000,
  ): Promise<void> {
    const el = (await elementID).atIndex(index);
    await waitFor(el).toBeVisible().withTimeout(timeout);
    await el.tap();
  }

  /**
   * Wait for a web element to be visible and then tap it.
   */
  static async tapWebElement(
    elementID: ElementInput<
      | Detox.IndexableWebElement
      | Detox.WebElement
      | Detox.SecuredWebElementFacade
    >,
  ): Promise<void> {
    const el = (await elementID) as Detox.WebElement;
    await el.tap();
  }

  /**
   * Double tap an element.
   */
  static async doubleTap(
    elementID: ElementInput<Detox.IndexableNativeElement | Detox.NativeElement>,
  ): Promise<void> {
    const el = await elementID;
    await el.multiTap(2);
  }

  /**
   * Clear the text field of an element identified by ID.
   */
  static async clearField(
    elementID: ElementInput<Detox.IndexableNativeElement | Detox.NativeElement>,
    timeout = 2500,
  ): Promise<void> {
    const el = await elementID;
    await waitFor(el).toBeVisible().withTimeout(timeout);
    await el.replaceText('');
  }

  /**
   * Type text into an element and hide the keyboard.
   */
  static async typeTextAndHideKeyboard(
    elementID: ElementInput<Detox.IndexableNativeElement | Detox.NativeElement>,
    text: string,
  ): Promise<void> {
    const el = await elementID;
    await this.clearField(elementID);
    await el.typeText(text + '\n');
  }

  /**
   * Replace the text in the field of an element identified by ID.
   */
  static async replaceTextInField(
    elementID: ElementInput<Detox.IndexableNativeElement | Detox.NativeElement>,
    text: string,
    timeout = 10000,
  ): Promise<void> {
    const el = await elementID;
    await waitFor(el).toBeVisible().withTimeout(timeout);
    await el.replaceText(text);
  }

  /**
   * Swipe on an element identified by ID.
   */
  static async swipe(
    elementID: ElementInput<Detox.IndexableNativeElement | Detox.NativeElement>,
    direction: Detox.Direction,
    speed?: Detox.Speed,
    percentage?: number,
    xStart?: number,
    yStart?: number,
  ): Promise<void> {
    const el = await elementID;
    await el.swipe(direction, speed, percentage, xStart, yStart);
  }

  /**
   * Swipe on an element at a given index.
   */
  static async swipeAtIndex(
    elementID: ElementInput<Detox.IndexableNativeElement>,
    direction: Detox.Direction,
    speed?: Detox.Speed,
    percentage?: number,
    xStart?: number,
    yStart?: number,
    index = 0,
  ): Promise<void> {
    const el = await elementID;
    await el.atIndex(index).swipe(direction, speed, percentage, xStart, yStart);
  }

  /**
   * Scrolls the web element until its top is at the top of the viewport.
   */
  static async scrollToWebViewPort(
    elem: ElementInput<
      | Detox.WebElement
      | Detox.IndexableWebElement
      | Detox.SecuredWebElementFacade
    >,
  ): Promise<void> {
    const el = (await elem) as Detox.WebElement;
    await el.scrollToView();
  }

  /**
   * Dynamically Scrolls to an element identified by ID.
   */
  static async scrollToElement(
    destinationElementID: ElementInput<
      Detox.IndexableNativeElement | Detox.NativeElement
    >,
    scrollIdentifier: ElementInput<Detox.NativeMatcher>,
    direction: Detox.Direction = 'down',
    scrollAmount = 350,
  ): Promise<void> {
    const destinationElement = await destinationElementID;
    const scrollableElement = await scrollIdentifier;

    await waitFor(destinationElement)
      .toBeVisible()
      .whileElement(scrollableElement)
      .scroll(scrollAmount, direction);
  }
}

export default Gestures;
