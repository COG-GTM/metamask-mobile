import { waitFor, expect as detoxExpect } from 'detox';
import Matchers from './Matchers';

type ElementInput<T> = Promise<T> | T;

type NativeOrIndexable = Detox.IndexableNativeElement | Detox.NativeElement;

type AnyWebElement =
  | Detox.IndexableWebElement
  | Detox.WebElement
  | Detox.SecuredWebElementFacade;

// Global timeout variable
const TIMEOUT = 15000;

/**
 * Class representing a set of assertions for Detox testing.
 */
class Assertions {
  /**
   * Check if an element with the specified ID is visible.
   * @param elementId - Resolves to the element to check.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfVisible(
    elementId: ElementInput<NativeOrIndexable>,
    timeout: number = TIMEOUT,
  ): Promise<boolean> {
    try {
      await waitFor(await elementId)
        .toBeVisible()
        .withTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if an element with the specified web selector exists.
   * @param elementId - Resolves to the web element to check.
   */
  static async webViewElementExists(
    elementId: ElementInput<AnyWebElement>,
  ): Promise<void> {
    const el = (await elementId) as Detox.IndexableWebElement;
    await detoxExpect(el).toExist();
  }

  /**
   * Check if an element with the specified ID is not visible.
   * @param elementId - Resolves to the element to check.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfNotVisible(
    elementId: ElementInput<NativeOrIndexable>,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    await waitFor(await elementId)
      .not.toBeVisible()
      .withTimeout(timeout);
  }

  /**
   * Check if an element with the specified ID does have the specified text.
   * @param elementId - Resolves to the element to check.
   * @param text - The text content to check.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfElementToHaveText(
    elementId: ElementInput<NativeOrIndexable>,
    text: string,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    await waitFor(await elementId)
      .toHaveText(text)
      .withTimeout(timeout);
  }

  /**
   * Check if an element with the specified ID does have the specified label.
   * @param elementId - Resolves to the element to check.
   * @param label - The label content to check.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfElementHasLabel(
    elementId: ElementInput<NativeOrIndexable>,
    label: string,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    await waitFor(await elementId)
      .toHaveLabel(label)
      .withTimeout(timeout);
  }

  /**
   * Check if text is visible.
   * @param text - The text to check if displayed.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfTextIsDisplayed(
    text: string | RegExp,
    timeout: number = TIMEOUT,
  ): Promise<boolean> {
    const el = Matchers.getElementByText(text);
    return this.checkIfVisible(el, timeout);
  }

  /**
   * Check if text is not visible.
   * @param text - The text to check if not displayed.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfTextIsNotDisplayed(
    text: string | RegExp,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    const el = Matchers.getElementByText(text);
    return this.checkIfNotVisible(el, timeout);
  }

  /**
   * Check if an element with the specified ID does not have the specified text.
   * @param elementId - Resolves to the element to check.
   * @param text - The text content to check.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfElementNotToHaveText(
    elementId: ElementInput<NativeOrIndexable>,
    text: string,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    await waitFor(await elementId)
      .not.toHaveText(text)
      .withTimeout(timeout);
  }

  /**
   * Check if an element with the specified ID does not have the specified label.
   * @param elementId - Resolves to the element to check.
   * @param label - The label content to check.
   * @param timeout - Timeout in milliseconds.
   */
  static async checkIfElementDoesNotHaveLabel(
    elementId: ElementInput<NativeOrIndexable>,
    label: string,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    await waitFor(await elementId)
      .not.toHaveLabel(label)
      .withTimeout(timeout);
  }

  /**
   * Check if the toggle with the specified ID is in the "on" state.
   * @param elementID - Resolves to the toggle element.
   */
  static async checkIfToggleIsOn(
    elementID: ElementInput<NativeOrIndexable>,
  ): Promise<void> {
    await detoxExpect(await elementID).toHaveToggleValue(true);
  }

  /**
   * Check if the toggle with the specified ID is in the "off" state.
   * @param elementID - Resolves to the toggle element.
   */
  static async checkIfToggleIsOff(
    elementID: ElementInput<NativeOrIndexable>,
  ): Promise<void> {
    await detoxExpect(await elementID).toHaveToggleValue(false);
  }

  /**
   * Check if two text values match exactly.
   * @param actualText - The actual text value to check.
   * @param expectedText - The expected text value to match against.
   */
  static async checkIfTextMatches(
    actualText: string,
    expectedText: string,
  ): Promise<void> {
    try {
      if (!actualText || !expectedText) {
        throw new Error('Both actual and expected text must be provided');
      }

      expect(actualText).toBe(expectedText);
    } catch {
      if (actualText !== expectedText) {
        throw new Error(
          `Text matching failed.\nExpected: "${expectedText}"\nActual: "${actualText}"`,
        );
      }
    }
  }

  /**
   * Check if two objects match exactly.
   * Note: This assertion does not test UI elements. It is intended for testing values such as events from the mock server or other non-UI data.
   * @param actualObject - The actual object to check.
   * @param expectedObject - The expected object to match against.
   */
  static async checkIfObjectsMatch(
    actualObject: unknown,
    expectedObject: unknown,
  ): Promise<void> {
    try {
      if (!actualObject || !expectedObject) {
        throw new Error('Both actual and expected objects must be provided');
      }

      expect(actualObject).toEqual(expectedObject);
    } catch {
      if (JSON.stringify(actualObject) !== JSON.stringify(expectedObject)) {
        throw new Error(
          `Object matching failed.\nExpected: ${JSON.stringify(
            expectedObject,
            null,
            2,
          )}\nActual: ${JSON.stringify(actualObject, null, 2)}`,
        );
      }
    }
  }

  /**
   * Check if an array has the expected length.
   * Note: This assertion does not test UI elements. It is intended for testing values such as events from the mock server or other non-UI data.
   * @param array - The array to check.
   * @param expectedLength - The expected length of the array.
   */
  static async checkIfArrayHasLength(
    array: unknown,
    expectedLength: number,
  ): Promise<void> {
    try {
      if (!Array.isArray(array)) {
        throw new Error('The provided value is not an array');
      }

      if (typeof expectedLength !== 'number') {
        throw new Error('Expected length must be a number');
      }

      expect(array.length).toBe(expectedLength);
    } catch {
      if (Array.isArray(array) && array.length !== expectedLength) {
        throw new Error(
          `Array length assertion failed.\nExpected length: ${expectedLength}\nActual length: ${array.length}`,
        );
      }
    }
  }

  /**
   * Check if a value is present (not null, not undefined, not an empty string).
   * Note: This assertion does not test UI elements. It is intended for testing values such as events from the mock server or other non-UI data.
   * @param value - The value to check.
   */
  static async checkIfValueIsPresent(
    value: unknown,
    key?: string,
  ): Promise<true> {
    if (key !== undefined) {
      if (
        value === null ||
        value === undefined ||
        typeof value !== 'object' ||
        (value as Record<string, unknown>)[key] === undefined ||
        (value as Record<string, unknown>)[key] === null ||
        (value as Record<string, unknown>)[key] === ''
      ) {
        throw new Error(`Value at key "${key}" is not present`);
      }
      return true;
    }
    if (value === null || value === undefined || value === '') {
      throw new Error('Value is not present (null, undefined, or empty string)');
    }
    return true;
  }
}

export default Assertions;
