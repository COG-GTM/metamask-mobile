import { waitFor } from 'detox';
import Matchers from './Matchers';

type ElementInput<T> = T | Promise<T>;

type AnyDetoxElement =
  | Detox.IndexableNativeElement
  | Detox.NativeElement
  | Detox.IndexableSystemElement
  | Detox.SystemElement
  | Detox.IndexableWebElement
  | Detox.WebElement;

// Global timeout variable
const TIMEOUT = 15000;

/**
 * Class representing a set of assertions for Detox testing.
 */
class Assertions {
  /**
   * Check if an element with the specified ID is visible.
   */
  static async checkIfVisible(
    elementId: ElementInput<AnyDetoxElement>,
    timeout = TIMEOUT,
  ): Promise<boolean> {
    try {
      const el = (await elementId) as Detox.NativeElement;
      await waitFor(el).toBeVisible().withTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if an element with the specified web selector exists.
   */
  static async webViewElementExists(
    elementId: ElementInput<AnyDetoxElement>,
  ): Promise<unknown> {
    const el = (await elementId) as Detox.NativeElement;
    return (expect(el) as unknown as { toExist: () => Promise<void> }).toExist();
  }

  /**
   * Check if an element with the specified ID is not visible.
   */
  static async checkIfNotVisible(
    elementId: ElementInput<AnyDetoxElement>,
    timeout = TIMEOUT,
  ): Promise<unknown> {
    const el = (await elementId) as Detox.NativeElement;
    return waitFor(el).not.toBeVisible().withTimeout(timeout);
  }

  /**
   * Check if an element with the specified ID does have the specified text.
   */
  static async checkIfElementToHaveText(
    elementId: ElementInput<AnyDetoxElement>,
    text: string,
    timeout = TIMEOUT,
  ): Promise<unknown> {
    const el = (await elementId) as Detox.NativeElement;
    return waitFor(el).toHaveText(text).withTimeout(timeout);
  }

  /**
   * Check if an element with the specified ID does have the specified label.
   */
  static async checkIfElementHasLabel(
    elementId: ElementInput<AnyDetoxElement>,
    label: string,
    timeout = TIMEOUT,
  ): Promise<unknown> {
    const el = (await elementId) as Detox.NativeElement;
    return waitFor(el).toHaveLabel(label).withTimeout(timeout);
  }

  /**
   * Check if text is visible.
   */
  static async checkIfTextIsDisplayed(
    text: string,
    timeout = TIMEOUT,
  ): Promise<boolean> {
    const el = Matchers.getElementByText(text);
    return this.checkIfVisible(el, timeout);
  }

  /**
   * Check if text is not visible.
   */
  static async checkIfTextIsNotDisplayed(
    text: string,
    timeout = TIMEOUT,
  ): Promise<unknown> {
    const el = Matchers.getElementByText(text);
    return this.checkIfNotVisible(el, timeout);
  }

  /**
   * Check if an element with the specified ID does not have the specified text.
   */
  static async checkIfElementNotToHaveText(
    elementId: ElementInput<AnyDetoxElement>,
    text: string,
    timeout = TIMEOUT,
  ): Promise<unknown> {
    const el = (await elementId) as Detox.NativeElement;
    return waitFor(el).not.toHaveText(text).withTimeout(timeout);
  }

  /**
   * Check if an element with the specified ID does not have the specified label.
   */
  static async checkIfElementDoesNotHaveLabel(
    elementId: ElementInput<AnyDetoxElement>,
    label: string,
    timeout = TIMEOUT,
  ): Promise<unknown> {
    const el = (await elementId) as Detox.NativeElement;
    return waitFor(el).not.toHaveLabel(label).withTimeout(timeout);
  }

  /**
   * Check if the toggle with the specified ID is in the "on" state.
   */
  static async checkIfToggleIsOn(
    elementID: ElementInput<AnyDetoxElement>,
  ): Promise<unknown> {
    const el = (await elementID) as Detox.NativeElement;
    return (expect(el) as unknown as { toHaveToggleValue: (v: boolean) => Promise<void> }).toHaveToggleValue(true);
  }

  /**
   * Check if the toggle with the specified ID is in the "off" state.
   */
  static async checkIfToggleIsOff(
    elementID: ElementInput<AnyDetoxElement>,
  ): Promise<unknown> {
    const el = (await elementID) as Detox.NativeElement;
    return (expect(el) as unknown as { toHaveToggleValue: (v: boolean) => Promise<void> }).toHaveToggleValue(false);
  }

  /**
   * Check if two text values match exactly.
   */
  static async checkIfTextMatches(
    actualText: string,
    expectedText: string,
  ): Promise<unknown> {
    try {
      if (!actualText || !expectedText) {
        throw new Error('Both actual and expected text must be provided');
      }
      return expect(actualText as unknown as Detox.NativeElement).toBe(
        expectedText,
      );
    } catch (error) {
      if (actualText !== expectedText) {
        throw new Error(
          `Text matching failed.\nExpected: "${expectedText}"\nActual: "${actualText}"`,
        );
      }
    }
  }

  /**
   * Check if two objects match exactly.
   */
  static async checkIfObjectsMatch(
    actualObject: unknown,
    expectedObject: unknown,
  ): Promise<unknown> {
    try {
      if (!actualObject || !expectedObject) {
        throw new Error('Both actual and expected objects must be provided');
      }
      return expect(actualObject as unknown as Detox.NativeElement).toEqual(
        expectedObject,
      );
    } catch (error) {
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
   */
  static async checkIfArrayHasLength(
    array: unknown[],
    expectedLength: number,
  ): Promise<unknown> {
    try {
      if (!Array.isArray(array)) {
        throw new Error('The provided value is not an array');
      }
      if (typeof expectedLength !== 'number') {
        throw new Error('Expected length must be a number');
      }
      return expect(
        array.length as unknown as Detox.NativeElement,
      ).toBe(expectedLength);
    } catch (error) {
      if (array.length !== expectedLength) {
        throw new Error(
          `Array length assertion failed.\nExpected length: ${expectedLength}\nActual length: ${array.length}`,
        );
      }
    }
  }

  /**
   * Check if a value is present (not null, not undefined, not an empty string).
   */
  static async checkIfValueIsPresent(value: unknown): Promise<boolean> {
    if (value === null || value === undefined || value === '') {
      throw new Error('Value is not present (null, undefined, or empty string)');
    }
    return true;
  }
}

export default Assertions;
