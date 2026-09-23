// External dependencies.
import { getLabelTextByAddress } from '../../../util/address';
import { Account } from '../../hooks/useAccounts';

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
  address,
  balanceError,
}: Pick<Account, 'address' | 'balanceError'>): number => {
  let height = ACCOUNT_ITEM_BASE_HEIGHT;
  if (balanceError) {
    height += ACCOUNT_ITEM_BALANCE_ERROR_HEIGHT;
  }
  if (getLabelTextByAddress(address)) {
    height += ACCOUNT_ITEM_TAG_LABEL_HEIGHT;
  }
  return height;
};

/**
 * Returns the y offset of every account item, relative to the start of the
 * list the accounts are rendered in.
 *
 * @param accounts Accounts rendered by the list.
 * @returns Y offset of each account item.
 */
export const getAccountItemOffsets = (
  accounts: Account[] | undefined,
): number[] => {
  let offset = 0;
  return (accounts ?? []).map((account) => {
    const itemOffset = offset;
    offset += getAccountItemHeight(account);
    return itemOffset;
  });
};
