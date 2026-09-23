// Third party dependencies.
import { KeyringTypes } from '@metamask/keyring-controller';

// Internal dependencies.
import { Account } from './useAccounts.types';

const ACCOUNT_ITEM_BASE_HEIGHT = 78;
const ACCOUNT_ITEM_BALANCE_ERROR_HEIGHT = 22;
const ACCOUNT_ITEM_TAG_LABEL_HEIGHT = 24;

/**
 * Returns the rendered height of an account list item.
 *
 * @param account Account to measure.
 * @returns Height of the account list item.
 */
export const getAccountItemHeight = ({
  type,
  balanceError,
}: Pick<Account, 'type' | 'balanceError'>): number => {
  let height = ACCOUNT_ITEM_BASE_HEIGHT;
  if (balanceError) {
    height += ACCOUNT_ITEM_BALANCE_ERROR_HEIGHT;
  }
  if (type !== KeyringTypes.hd) {
    height += ACCOUNT_ITEM_TAG_LABEL_HEIGHT;
  }
  return height;
};
