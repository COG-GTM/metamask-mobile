import { isEqualCaseInsensitive } from '@metamask/controller-utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { selectSelectedInternalAccount } from '../accountsController';
import { selectHDKeyrings, ExtendedKeyring } from '../keyringController';
import { createDeepEqualSelector } from '../util';

/**
 * !! Only use this selector after onboarding
 * Selects the HD keyring of the currently selected account, or falls back to the primary HD keyring
 * @param state - The Redux state
 * @returns The HD keyring containing the selected account if it's an HD keyring, otherwise returns the primary HD keyring
 */
export const getHdKeyringOfSelectedAccountOrPrimaryKeyring =
  createDeepEqualSelector(
    selectSelectedInternalAccount,
    selectHDKeyrings,
    (
      selectedAccount: InternalAccount | undefined,
      hdKeyrings: ExtendedKeyring[],
    ) => {
      if (!selectedAccount || hdKeyrings.length === 0) {
        // Should never reach this point. This selector is only used after onboarding.
        throw new Error('No selected account or hd keyrings');
      }

      const selectedKeyring = hdKeyrings.find(
        (keyring) =>
          keyring.accounts.some((account) =>
            isEqualCaseInsensitive(account, selectedAccount.address),
          ) && keyring.type === selectedAccount.metadata.keyring.type,
      );

      if (!selectedKeyring) {
        return hdKeyrings[0];
      }

      return selectedKeyring;
    },
  );
