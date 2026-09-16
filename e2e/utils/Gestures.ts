import { waitFor } from 'detox';

type MaybePromise<T> = T | Promise<T>;

type NativeElementInput = MaybePromise<
  Detox.IndexableNativeElement | Detox.NativeElement
>;

type IndexableNativeElementInput = MaybePromise<Detox.IndexableNativeElement>;

type WebElementInput = MaybePromise<
  Detox.IndexableWebElement | Detox.WebElement
>;

/**
 * Class for handling user actions (Gestures)
 */
class Gestures {
  /**
   * Tap an element and long press.
   *
   * @param {Promise<Detox.IndexableNativeElement>} elementID - ID of the element to tap
   * @param {number} timeout - Timeout for waiting (default: 2000ms)
   */
  static async tapAndLongPress(elementID: NativeElementInput, timeout = 2000) {
    const elem = await elementID;

    await elem.longPress(timeout);
  }

  /**
   * Tap an element at a specific point.
   *
   * @param {Promise<Detox.IndexableNativeElement>} elementID - ID of the element to tap
   * @param {Object} point - Coordinates { x, y } where the element will be tapped
   */
  static async tapAtPoint(elementID: NativeElementInput, point: Detox.Point2D) {
    const elem = await elementID;
    await elem.tap(point);
  }

  /**
   * Wait for an element to be visible and then tap it.
   *
   * @param {Promise<Detox.IndexableNativeElement>} elementID - ID of the element to tap

   */
  static async tap(elementID: NativeElementInput) {
    const elem = await elementID;
    await elem.tap();
  }

  /**
   * Tap an element with text partial text matching before tapping it
   *
   * @param {string} textPattern - Regular expression pattern to match the text
   */
  static async tapTextBeginingWith(textPattern: string) {
    await element(by.text(new RegExp(`^/${textPattern} .*$/`))).tap();
  }

  /**
   * Wait for an element to be visible and then tap it.
   *
   * @param {Promise<Detox.IndexableNativeElement | Detox.SystemElement>} elementID - ID of the element to tap
   * @param {number} timeout - Timeout for waiting (default: 8000ms)
   */
  static async waitAndTap(
    elementID: MaybePromise<
      Detox.IndexableNativeElement | Detox.NativeElement | Detox.SystemElement
    >,
    timeout = 15000,
  ) {
    const elem = (await elementID) as Detox.NativeElement;
    await waitFor(elem).toBeVisible().withTimeout(timeout);
    await elem.tap();
  }

  /**
   * Wait for an element at a specific index to be visible and then tap it.
   *
   * @param {Promise<Detox.IndexableNativeElement>} elementID - ID of the element to tap
   * @param {number} index - Index of the element to tap
   * @param {number} timeout - Timeout for waiting (default: 15000ms)
   */
  static async TapAtIndex(
    elementID: IndexableNativeElementInput,
    index: number,
    timeout = 15000,
  ) {
    const elem = (await elementID).atIndex(index);
    await waitFor(elem).toBeVisible().withTimeout(timeout);
    await elem.tap();
  }

  /**
   * Wait for an element to be visible and then tap it.
   *
   * @param {Promise<Detox.IndexableWebElement>} elementID - ID of the element to tap
   */
  static async tapWebElement(elementID: WebElementInput) {
    const elem = await elementID;
    await elem.tap();
  }

  /**
   * Double tap an element by text.
   *
   * @param {Promise<Detox.IndexableNativeElement>} elementID - Text of the element to double tap
   */
  static async doubleTap(elementID: NativeElementInput) {
    const elem = await elementID;

    await elem.multiTap(2);
  }

  /**
   * Clear the text field of an element identified by ID.
   *
   * @param {Promise<Detox.IndexableNativeElement>} elementID - ID of the element to clear
   * @param {number} timeout - Timeout for waiting (default: 8000ms)

  */
  static async clearField(elementID: NativeElementInput, timeout = 2500) {
    const elem = await elementID;
    await waitFor(elem).toBeVisible().withTimeout(timeout);

    await elem.replaceText('');
  }

  /**
   * Type text into an element and hide the keyboard.
   *
   * @param {Promise<Detox.IndexableNativeElement>} elementID - ID of the element to type into
   * @param {string} text - Text to be typed into the element
   */
  static async typeTextAndHideKeyboard(
    elementID: NativeElementInput,
    text: string,
  ) {
    const elem = await elementID;
    await this.clearField(elementID);

    await elem.typeText(text + '\n');
  }

  /**
   * Replace the text in the field of an element identified by ID.
   *
   * @param {Promise<Detox.IndexableNativeElement>} elementID - ID of the element to replace the text in
   * @param {string} text - Text to replace the existing text in the element
   */
  static async replaceTextInField(
    elementID: NativeElementInput,
    text: string,
    timeout = 10000,
  ) {
    const elem = await elementID;
    await waitFor(elem).toBeVisible().withTimeout(timeout);

    await elem.replaceText(text);
  }

  /**
   * Swipe on an element identified by ID.
   *
   * @param {Promise<Detox.IndexableNativeElement>} elementID - ID of the element to swipe on
   * @param {Detox.Direction} direction - Direction of the swipe - left | right | top | bottom | up | down
   * @param {Detox.Speed} [speed] - Speed of the swipe (fast, slow)
   * @param {number} [percentage] - Percentage of the swipe (0 to 1)
   * @param {number} [xStart] - X-coordinate to start the swipe
   * @param {number} [yStart] - Y-coordinate to start the swipe
   */
  static async swipe(
    elementID: NativeElementInput,
    direction: Detox.Direction,
    speed?: Detox.Speed,
    percentage?: number,
    xStart?: number,
    yStart?: number,
  ) {
    const elem = await elementID;

    await elem.swipe(direction, speed, percentage, xStart, yStart);
  }

  /**
   * Swipe on an element identified by ID.
   *
   * @param {Promise<Detox.IndexableNativeElement>} elementID - ID of the element to swipe on
   * @param {Detox.Direction} direction - Direction of the swipe - left | right | top | bottom | up | down
   * @param {Detox.Speed} [speed] - Speed of the swipe (fast, slow)
   * @param {number} [percentage] - Percentage of the swipe (0 to 1)
   * @param {number} [xStart] - X-coordinate to start the swipe
   * @param {number} [yStart] - Y-coordinate to start the swipe
   * @param {number} index - Index of the element (default 0)
   */
  static async swipeAtIndex(
    elementID: IndexableNativeElementInput,
    direction: Detox.Direction,
    speed?: Detox.Speed,
    percentage?: number,
    xStart?: number,
    yStart?: number,
    index = 0,
  ) {
    const elem = await elementID;

    await elem
      .atIndex(index)
      .swipe(direction, speed, percentage, xStart, yStart);
  }

  /**
   * Scrolls the web element until its top is at the top of the viewport.
   * @param {Promise<Element>} elementID - A promise resolving to the target element.
   */
  static async scrollToWebViewPort(elementID: WebElementInput) {
    const elem = await elementID;
    await elem.scrollToView();
  }

  /**
   * Dynamically Scrolls to an element identified by ID.
   *
   * @param {Promise<Detox.IndexableNativeElement>} destinationElementID - ID of the element to scroll up to
   * @param {number} scrollIdentifier - The identifier (by.id) NOT elementID (element(by.id)). Keep this distinction in mind. If you pass in an elementID this method would not work as intended
   * @param {Detox.Direction} direction - Direction of the scroll (up, down, left, right). The default is down.
   * @param {number} [scrollAmount=350] - The amount to scroll (default is 350). Optional parameter.   */
  static async scrollToElement(
    destinationElementID: NativeElementInput,
    scrollIdentifier: MaybePromise<Detox.NativeMatcher>,
    direction: Detox.Direction = 'down',
    scrollAmount = 350,
  ) {
    const destinationElement = await destinationElementID;
    const scrollableElement = await scrollIdentifier;

    await waitFor(destinationElement)
      .toBeVisible()
      .whileElement(scrollableElement)
      .scroll(scrollAmount, direction);
  }
}

export default Gestures;
