import { waitFor, expect as detoxExpect } from 'detox';
import Matchers from './Matchers';

type AssertableElement =
  | Promise<
      | Detox.IndexableNativeElement
      | Detox.NativeElement
      | Detox.IndexableSystemElement
      | Detox.SystemElement
      | Detox.IndexableWebElement
      | Detox.SecuredWebElementFacade
    >
  | Detox.IndexableNativeElement
  | Detox.NativeElement
  | Detox.IndexableSystemElement
  | Detox.SystemElement;

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
    elementId: AssertableElement,
    timeout: number = TIMEOUT,
  ): Promise<boolean> {
    try {
      await waitFor(
        (await elementId) as Detox.IndexableNativeElement | Detox.NativeElement,
      )
        .toBeVisible()
        .withTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if an element with the specified web selector exists.
   */
  static async webViewElementExists(
    elementId: Promise<
      Detox.IndexableWebElement | Detox.SecuredWebElementFacade
    >,
  ): Promise<void> {
    return await detoxExpect((await elementId) as Detox.IndexableWebElement).toExist();
  }

  /**
   * Check if an element with the specified ID is not visible.
   */
  static async checkIfNotVisible(
    elementId: AssertableElement,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    return await waitFor(
      (await elementId) as Detox.IndexableNativeElement | Detox.NativeElement,
    )
      .not.toBeVisible()
      .withTimeout(timeout);
  }

  /**
   * Check if an element with the specified ID does have the specified text.
   */
  static async checkIfElementToHaveText(
    elementId: AssertableElement,
    text: string,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    return await waitFor(
      (await elementId) as Detox.IndexableNativeElement | Detox.NativeElement,
    )
      .toHaveText(text)
      .withTimeout(timeout);
  }

  /**
   * Check if an element with the specified ID does have the specified label.
   */
  static async checkIfElementHasLabel(
    elementId: AssertableElement,
    label: string,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    return await waitFor(
      (await elementId) as Detox.IndexableNativeElement | Detox.NativeElement,
    )
      .toHaveLabel(label)
      .withTimeout(timeout);
  }

  /**
   * Check if text is visible.
   */
  static async checkIfTextIsDisplayed(
    text: string | RegExp,
    timeout: number = TIMEOUT,
  ): Promise<boolean> {
    const element = Matchers.getElementByText(text);
    return this.checkIfVisible(element, timeout);
  }

  /**
   * Check if text is not visible.
   */
  static async checkIfTextIsNotDisplayed(
    text: string | RegExp,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    const element = Matchers.getElementByText(text);
    return this.checkIfNotVisible(element, timeout);
  }

  /**
   * Check if an element with the specified ID does not have the specified text.
   */
  static async checkIfElementNotToHaveText(
    elementId: AssertableElement,
    text: string,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    return await waitFor(
      (await elementId) as Detox.IndexableNativeElement | Detox.NativeElement,
    )
      .not.toHaveText(text)
      .withTimeout(timeout);
  }

  /**
   * Check if an element with the specified ID does not have the specified label.
   */
  static async checkIfElementDoesNotHaveLabel(
    elementId: AssertableElement,
    label: string,
    timeout: number = TIMEOUT,
  ): Promise<void> {
    return await waitFor(
      (await elementId) as Detox.IndexableNativeElement | Detox.NativeElement,
    )
      .not.toHaveLabel(label)
      .withTimeout(timeout);
  }

  /**
   * Check if the toggle with the specified ID is in the "on" state.
   */
  static async checkIfToggleIsOn(elementID: AssertableElement): Promise<void> {
    return detoxExpect(
      (await elementID) as Detox.IndexableNativeElement | Detox.NativeElement,
    ).toHaveToggleValue(true);
  }

  /**
   * Check if the toggle with the specified ID is in the "off" state.
   */
  static async checkIfToggleIsOff(elementID: AssertableElement): Promise<void> {
    return detoxExpect(
      (await elementID) as Detox.IndexableNativeElement | Detox.NativeElement,
    ).toHaveToggleValue(false);
  }

  /**
   * Check if two text values match exactly.
   */
  static async checkIfTextMatches(
    actualText: string,
    expectedText: string,
  ): Promise<void> {
    try {
      if (!actualText || !expectedText) {
        throw new Error('Both actual and expected text must be provided');
      }

      return expect(actualText).toBe(expectedText);
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
   * Note: This assertion does not test UI elements. It is intended for testing values such as events from the mock server or other non-UI data.
   */
  static async checkIfObjectsMatch(
    actualObject: unknown,
    expectedObject: unknown,
  ): Promise<void> {
    try {
      if (!actualObject || !expectedObject) {
        throw new Error('Both actual and expected objects must be provided');
      }

      return expect(actualObject).toEqual(expectedObject);
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
  ): Promise<void> {
    try {
      if (!Array.isArray(array)) {
        throw new Error('The provided value is not an array');
      }

      if (typeof expectedLength !== 'number') {
        throw new Error('Expected length must be a number');
      }

      return expect(array.length).toBe(expectedLength);
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
  static async checkIfValueIsPresent(
    value: unknown,
    _key?: string,
  ): Promise<boolean> {
    if (value === null || value === undefined || value === '') {
      throw new Error('Value is not present (null, undefined, or empty string)');
    }
    return true;
  }
}

export default Assertions;
