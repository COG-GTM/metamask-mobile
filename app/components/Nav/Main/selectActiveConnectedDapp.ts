import { createSelector } from 'reselect';
import isUrl from 'is-url';
import Url from 'url-parse';
import { RootState } from '../../../reducers';
import { getActiveTabUrl } from '../../../util/transactions';
import { getAccountsFromSubject } from '../../../core/Permissions';
import { selectPermissionControllerState } from '../../../selectors/snaps/permissionController';
import { selectInternalAccounts } from '../../../selectors/accountsController';
import Logger from '../../../util/Logger';

const EMPTY_ACCOUNTS: string[] = [];

const selectActiveTabUrl = (state: RootState): string | undefined =>
  getActiveTabUrl(state);

export const selectActiveTabHostname = createSelector(
  selectActiveTabUrl,
  (activeTabUrl): string | undefined => {
    if (!activeTabUrl || !isUrl(activeTabUrl)) return undefined;
    try {
      return new Url(activeTabUrl).hostname;
    } catch (error) {
      Logger.error(error as Error, {
        message: 'ParseUrl::MainNavigator error while parsing URL',
      });
      return undefined;
    }
  },
);

const selectActiveTabSubject = createSelector(
  selectPermissionControllerState,
  selectActiveTabHostname,
  (permissionControllerState, hostname) => {
    const subjects = permissionControllerState?.subjects;
    if (
      !hostname ||
      !subjects ||
      !Object.prototype.hasOwnProperty.call(subjects, hostname)
    ) {
      return undefined;
    }
    return subjects[hostname];
  },
);

/**
 * Accounts permitted for the active browser tab's hostname, ordered by last selected.
 * Recomputed only when the active tab hostname, that hostname's permission subject,
 * or the internal accounts (which drive the ordering) change.
 */
export const selectActiveConnectedDapp = createSelector(
  selectActiveTabSubject,
  selectInternalAccounts,
  (subject): string[] => {
    if (!subject) return EMPTY_ACCOUNTS;
    try {
      return getAccountsFromSubject(subject);
    } catch (error) {
      Logger.error(error as Error, {
        message:
          'MainNavigator error while getting permitted accounts for active tab',
      });
      return EMPTY_ACCOUNTS;
    }
  },
);
