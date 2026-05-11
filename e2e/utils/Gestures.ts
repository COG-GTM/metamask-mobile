import { waitFor } from 'detox';

type NativeOrIndexable = Detox.IndexableNativeElement | Detox.NativeElement;

type ElementInput<T> = Promise<T> | T;

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
   *
   * @param elementID - ID of the element to tap
   * @param timeout - Timeout for waiting (default: 2000ms)
   */
  static async tapAndLongPress(
    elementID: ElementInput<Detox.IndexableNativeElement | Detox.NativeElement>,
    timeout: number = 2000,
  ): Promise<void> {
    const el = await elementID;

    await el.longPress(timeout);
  }

  /**
   * Tap an element at a specific point.
   *
   * @param elementID - ID of the element to tap
   * @param point - Coordinates { x, y } where the element will be tapped
   */
  static async tapAtPoint(
    elementID: ElementInput<Detox.IndexableNativeElement | Detox.NativeElement>,
    point: Point,
  ): Promise<void> {
    const el = await elementID;
    await el.tap(point);
  }

  /**
   * Wait for an element to be visible and then tap it.
   *
   * @param elementID - ID of the element to tap
   */
  static async tap(
    elementID: ElementInput<
      | Detox.IndexableNativeElement
      | Detox.NativeElement
      | Detox.SystemElement
    >,
  ): Promise<void> {
    const el = await elementID;
    await el.tap();
  }

  /**
   * Tap an element with text partial text matching before tapping it
   *
   * @param textPattern - Regular expression pattern to match the text
   */
  static async tapTextBeginingWith(textPattern: string): Promise<void> {
    await element(by.text(new RegExp(`^/${textPattern} .*$/`))).tap();
  }

  /**
   * Wait for an element to be visible and then tap it.
   *
   * @param elementID - ID of the element to tap
   * @param timeout - Timeout for waiting (default: 15000ms)
   */
  static async waitAndTap(
    elementID: ElementInput<NativeOrIndexable>,
    timeout: number = 15000,
  ): Promise<void> {
    const el = await elementID;
    await waitFor(el).toBeVisible().withTimeout(timeout);
    await el.tap();
  }

  /**
   * Wait for an element at a specific index to be visible and then tap it.
   *
   * @param elementID - ID of the element to tap
   * @param index - Index of the element to tap
   * @param timeout - Timeout for waiting (default: 15000ms)
   */
  static async TapAtIndex(
    elementID: ElementInput<Detox.IndexableNativeElement>,
    index: number,
    timeout: number = 15000,
  ): Promise<void> {
    const el = (await elementID).atIndex(index);
    await waitFor(el).toBeVisible().withTimeout(timeout);
    await el.tap();
  }

  /**
   * Wait for an element to be visible and then tap it.
   *
   * @param elementID - ID of the element to tap
   */
  static async tapWebElement(
    elementID: ElementInput<
      | Detox.IndexableWebElement
      | Detox.WebElement
      | Detox.SecuredWebElementFacade
    >,
  ): Promise<void> {
    const el = (await elementID) as Detox.IndexableWebElement;
    await el.tap();
  }

  /**
   * Double tap an element by text.
   *
   * @param elementID - Element to double tap
   */
  static async doubleTap(
    elementID: ElementInput<Detox.IndexableNativeElement | Detox.NativeElement>,
  ): Promise<void> {
    const el = await elementID;

    await el.multiTap(2);
  }

  /**
   * Clear the text field of an element identified by ID.
   *
   * @param elementID - ID of the element to clear
   * @param timeout - Timeout for waiting (default: 2500ms)
   */
  static async clearField(
    elementID: ElementInput<Detox.IndexableNativeElement | Detox.NativeElement>,
    timeout: number = 2500,
  ): Promise<void> {
    const el = await elementID;
    await waitFor(el).toBeVisible().withTimeout(timeout);

    await el.replaceText('');
  }

  /**
   * Type text into an element and hide the keyboard.
   *
   * @param elementID - ID of the element to type into
   * @param text - Text to be typed into the element
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
   *
   * @param elementID - ID of the element to replace the text in
   * @param text - Text to replace the existing text in the element
   * @param timeout - Timeout for waiting (default: 10000ms)
   */
  static async replaceTextInField(
    elementID: ElementInput<Detox.IndexableNativeElement | Detox.NativeElement>,
    text: string,
    timeout: number = 10000,
  ): Promise<void> {
    const el = await elementID;
    await waitFor(el).toBeVisible().withTimeout(timeout);

    await el.replaceText(text);
  }

  /**
   * Swipe on an element identified by ID.
   *
   * @param elementID - ID of the element to swipe on
   * @param direction - Direction of the swipe - left | right | top | bottom | up | down
   * @param speed - Speed of the swipe (fast, slow)
   * @param percentage - Percentage of the swipe (0 to 1)
   * @param xStart - X-coordinate to start the swipe
   * @param yStart - Y-coordinate to start the swipe
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
   * Swipe on an element identified by ID, at a specific index.
   *
   * @param elementID - ID of the element to swipe on
   * @param direction - Direction of the swipe - left | right | top | bottom | up | down
   * @param speed - Speed of the swipe (fast, slow)
   * @param percentage - Percentage of the swipe (0 to 1)
   * @param xStart - X-coordinate to start the swipe
   * @param yStart - Y-coordinate to start the swipe
   * @param index - Index of the element (default 0)
   */
  static async swipeAtIndex(
    elementID: ElementInput<Detox.IndexableNativeElement>,
    direction: Detox.Direction,
    speed?: Detox.Speed,
    percentage?: number,
    xStart?: number,
    yStart?: number,
    index: number = 0,
  ): Promise<void> {
    const el = await elementID;

    await el
      .atIndex(index)
      .swipe(direction, speed, percentage, xStart, yStart);
  }

  /**
   * Scrolls the web element until its top is at the top of the viewport.
   * @param elem - A promise resolving to the target web element.
   */
  static async scrollToWebViewPort(
    elem: ElementInput<
      | Detox.IndexableWebElement
      | Detox.WebElement
      | Detox.SecuredWebElementFacade
    >,
  ): Promise<void> {
    const el = (await elem) as Detox.IndexableWebElement;
    await el.scrollToView();
  }

  /**
   * Dynamically scrolls to an element identified by ID.
   *
   * @param destinationElementID - ID of the element to scroll up to
   * @param scrollIdentifier - The matcher (by.id) used by whileElement(). Pass a matcher, not a resolved element.
   * @param direction - Direction of the scroll (up, down, left, right). Default is `down`.
   * @param scrollAmount - The amount to scroll (default is 350).
   */
  static async scrollToElement(
    destinationElementID: ElementInput<
      Detox.IndexableNativeElement | Detox.NativeElement
    >,
    scrollIdentifier: ElementInput<Detox.NativeMatcher>,
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
