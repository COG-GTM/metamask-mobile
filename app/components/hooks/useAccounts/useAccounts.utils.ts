// Third party dependencies.
import { KeyringTypes } from '@metamask/keyring-controller';

// Internal dependencies.
import { Account } from './useAccounts.types';

const BASE_ACCOUNT_CELL_HEIGHT = 78;
const BALANCE_ERROR_HEIGHT = 22;
const TAG_LABEL_HEIGHT = 24;

/**
 * Returns the rendered height of an account cell, including the extra space
 * taken by a balance error and by the keyring tag label of non-HD accounts.
 *
 * @param account - Account to measure.
 * @returns Height of the account cell in pixels.
 */
export const getAccountCellHeight = (
  account: Pick<Account, 'balanceError' | 'type'>,
): number =>
  BASE_ACCOUNT_CELL_HEIGHT +
  (account.balanceError ? BALANCE_ERROR_HEIGHT : 0) +
  (account.type !== KeyringTypes.hd ? TAG_LABEL_HEIGHT : 0);
