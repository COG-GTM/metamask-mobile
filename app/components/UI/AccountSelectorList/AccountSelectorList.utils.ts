// External dependencies.
import { getLabelTextByAddress } from '../../../util/address';
import { Account } from '../../hooks/useAccounts';

// Cell padding (16 top + 16 bottom) plus the title and secondary text lines,
// both rendered with a 24 point line height.
const ACCOUNT_ITEM_BASE_HEIGHT = 80;
// Tag height (24) plus its top margin (4).
const ACCOUNT_ITEM_TAG_LABEL_HEIGHT = 28;
// Tertiary text line height.
const ACCOUNT_ITEM_BALANCE_ERROR_HEIGHT = 24;

interface AccountItemLayoutOptions {
  /**
   * Whether the rendered cell variant displays the balance error as tertiary
   * text. CellVariant.SelectWithMenu omits it.
   */
  rendersBalanceError: boolean;
}

/**
 * Returns the rendered height of an account list item.
 *
 * @param account Account to measure.
 * @param options Layout options of the list the account is rendered in.
 * @returns Height of the account list item.
 */
export const getAccountItemHeight = (
  { address, balanceError }: Pick<Account, 'address' | 'balanceError'>,
  { rendersBalanceError }: AccountItemLayoutOptions,
): number => {
  let height = ACCOUNT_ITEM_BASE_HEIGHT;
  if (balanceError && rendersBalanceError) {
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
 * @param options Layout options of the list the accounts are rendered in.
 * @returns Y offset of each account item.
 */
export const getAccountItemOffsets = (
  accounts: Account[] | undefined,
  options: AccountItemLayoutOptions,
): number[] => {
  let offset = 0;
  return (accounts ?? []).map((account) => {
    const itemOffset = offset;
    offset += getAccountItemHeight(account, options);
    return itemOffset;
  });
};
