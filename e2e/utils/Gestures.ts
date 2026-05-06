import { waitFor } from 'detox';

type ElementOrPromise = Detox.IndexableNativeElement | Detox.NativeElement;
type GestureElement = Promise<ElementOrPromise> | ElementOrPromise;
type GestureSystemElement =
  | Promise<Detox.IndexableNativeElement | Detox.SystemElement>
  | Detox.IndexableNativeElement
  | Detox.SystemElement;

interface Point {
  x: number;
  y: number;
}

/**
 * Class for handling user actions (Gestures)
 */
class Gestures {
  /**
   * Tap an element and long press.
   */
  static async tapAndLongPress(
    elementID: GestureElement,
    timeout: number = 2000,
  ): Promise<void> {
    const element = await elementID;
    await element.longPress(timeout);
  }

  /**
   * Tap an element at a specific point.
   */
  static async tapAtPoint(
    elementID: GestureElement,
    point: Point,
  ): Promise<void> {
    const element = await elementID;
    await element.tap(point);
  }

  /**
   * Tap an element. An optional index is accepted for compatibility with
   * historical callers; it is currently unused.
   */
  static async tap(
    elementID: GestureElement,
    _index?: number,
  ): Promise<void> {
    const element = await elementID;
    await element.tap();
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
    elementID: GestureSystemElement,
    timeout: number = 15000,
  ): Promise<void> {
    const element = (await elementID) as
      | Detox.IndexableNativeElement
      | Detox.NativeElement;
    await waitFor(element).toBeVisible().withTimeout(timeout);
    await element.tap();
  }

  /**
   * Wait for an element at a specific index to be visible and then tap it.
   */
  static async TapAtIndex(
    elementID: Promise<
      Detox.IndexableNativeElement | Detox.NativeElement
    >,
    index: number,
    timeout: number = 15000,
  ): Promise<void> {
    const resolved =
      (await elementID) as Detox.IndexableNativeElement;
    const element = resolved.atIndex(index);
    await waitFor(element).toBeVisible().withTimeout(timeout);
    await element.tap();
  }

  /**
   * Tap a web element.
   */
  static async tapWebElement(
    elementID: Promise<Detox.IndexableWebElement | Detox.SecuredWebElementFacade>,
  ): Promise<void> {
    const element = (await elementID) as Detox.IndexableWebElement;
    await element.tap();
  }

  /**
   * Double tap an element.
   */
  static async doubleTap(elementID: GestureElement): Promise<void> {
    const element = await elementID;
    await element.multiTap(2);
  }

  /**
   * Clear the text field of an element identified by ID.
   */
  static async clearField(
    elementID: GestureElement,
    timeout: number = 2500,
  ): Promise<void> {
    const element = await elementID;
    await waitFor(element).toBeVisible().withTimeout(timeout);
    await element.replaceText('');
  }

  /**
   * Type text into an element and hide the keyboard.
   */
  static async typeTextAndHideKeyboard(
    elementID: GestureElement,
    text: string,
  ): Promise<void> {
    const element = await elementID;
    await this.clearField(elementID);
    await element.typeText(text + '\n');
  }

  /**
   * Replace the text in the field of an element identified by ID.
   */
  static async replaceTextInField(
    elementID: GestureElement,
    text: string,
    timeout: number = 10000,
  ): Promise<void> {
    const element = await elementID;
    await waitFor(element).toBeVisible().withTimeout(timeout);
    await element.replaceText(text);
  }

  /**
   * Swipe on an element identified by ID.
   */
  static async swipe(
    elementID: GestureElement,
    direction: Detox.Direction,
    speed?: Detox.Speed,
    percentage?: number,
    xStart?: number,
    yStart?: number,
  ): Promise<void> {
    const element = await elementID;
    await element.swipe(direction, speed, percentage, xStart, yStart);
  }

  /**
   * Swipe on an element at a specific index.
   */
  static async swipeAtIndex(
    elementID: Promise<
      Detox.IndexableNativeElement | Detox.NativeElement
    >,
    direction: Detox.Direction,
    speed?: Detox.Speed,
    percentage?: number,
    xStart?: number,
    yStart?: number,
    index: number = 0,
  ): Promise<void> {
    const element = (await elementID) as Detox.IndexableNativeElement;
    await element
      .atIndex(index)
      .swipe(direction, speed, percentage, xStart, yStart);
  }

  /**
   * Scrolls the web element until its top is at the top of the viewport.
   */
  static async scrollToWebViewPort(
    elem: Promise<Detox.IndexableWebElement | Detox.SecuredWebElementFacade>,
  ): Promise<void> {
    const element = (await elem) as Detox.IndexableWebElement;
    await element.scrollToView();
  }

  /**
   * Dynamically Scrolls to an element identified by ID.
   */
  static async scrollToElement(
    destinationElementID: GestureElement,
    scrollIdentifier: Promise<Detox.NativeMatcher> | Detox.NativeMatcher,
    direction: Detox.Direction = 'down',
    scrollAmount: number = 350,
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
