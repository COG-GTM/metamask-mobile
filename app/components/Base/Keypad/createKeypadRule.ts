import { regex, hasDecimals } from '../../../../app/util/regex';
import { KEYS, type KeypadKey } from './constants';

export interface CreateKeypadRuleOptions {
  decimalSeparator?: string | null | false;
  decimals?: number | null | false;
}

export type KeypadRuleHandler = (
  currentAmount: string | null | undefined,
  inputKey: KeypadKey,
) => string;

export default function createKeypadRule({
  decimalSeparator = null,
  decimals = null,
}: CreateKeypadRuleOptions = {}): KeypadRuleHandler {
  return function handler(currentAmount, inputKey) {
    if (!currentAmount) {
      currentAmount = '0';
    }

    switch (inputKey) {
      case KEYS.PERIOD: {
        if (!decimalSeparator || decimals === 0 || decimals === false) {
          return currentAmount;
        }

        if (currentAmount.includes(decimalSeparator)) {
          return currentAmount;
        }

        return `${currentAmount}${decimalSeparator}`;
      }
      case KEYS.BACK: {
        if (currentAmount === '0') {
          return currentAmount;
        }
        if (regex.hasOneDigit.test(currentAmount)) {
          return '0';
        }

        return currentAmount.slice(0, -1);
      }
      case KEYS.INITIAL: {
        return '0';
      }
      case KEYS.DIGIT_0:
      case KEYS.DIGIT_1:
      case KEYS.DIGIT_2:
      case KEYS.DIGIT_3:
      case KEYS.DIGIT_4:
      case KEYS.DIGIT_5:
      case KEYS.DIGIT_6:
      case KEYS.DIGIT_7:
      case KEYS.DIGIT_8:
      case KEYS.DIGIT_9: {
        if (currentAmount === '0') {
          return inputKey;
        }

        if (
          hasDecimals(String(decimalSeparator), String(decimals)).test(
            currentAmount,
          )
        ) {
          return currentAmount;
        }

        return `${currentAmount}${inputKey}`;
      }
      default: {
        return currentAmount;
      }
    }
  };
}
