import { MutableRefObject, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import URLParse from 'url-parse';
import { RootState } from '../../../reducers';
import { selectPermissionControllerState } from '../../../selectors/snaps/permissionController';
import { selectInternalAccounts } from '../../../selectors/accountsController';
import { getAccountsFromSubject } from '../../../core/Permissions';

/**
 * Returns the accounts permitted for the hostname of the URL held in `urlRef`,
 * sorted by most recently selected.
 *
 * The selector only reads the PermissionController subject for the current
 * hostname (a reference read), so Redux dispatches that don't touch that
 * subject or the AccountsController state do no URL parsing and no permission
 * traversal. The returned array keeps its identity while its contents are
 * unchanged.
 *
 * @param urlRef - Ref holding the currently resolved URL of the tab.
 * @returns The permitted account addresses for the current hostname.
 */
const usePermittedAccountsForUrl = (
  urlRef: MutableRefObject<string>,
): string[] => {
  const hostnameCacheRef = useRef({ url: '', hostname: '' });
  const getHostname = useCallback(() => {
    const cache = hostnameCacheRef.current;
    if (cache.url !== urlRef.current) {
      cache.url = urlRef.current;
      cache.hostname = new URLParse(cache.url).hostname;
    }
    return cache.hostname;
  }, [urlRef]);

  const subject = useSelector((state: RootState) => {
    const subjects = selectPermissionControllerState(state)?.subjects;
    const hostname = getHostname();
    return subjects && Object.prototype.hasOwnProperty.call(subjects, hostname)
      ? subjects[hostname]
      : undefined;
  });
  // Account order depends on AccountsController lastSelected metadata.
  const internalAccounts = useSelector(selectInternalAccounts);

  const accountsRef = useRef<string[]>([]);
  return useMemo(() => {
    const accounts = getAccountsFromSubject(subject);
    if (!isEqual(accounts, accountsRef.current)) {
      accountsRef.current = accounts;
    }
    return accountsRef.current;
    // internalAccounts is read indirectly by getAccountsFromSubject (via Engine).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, internalAccounts]);
};

export default usePermittedAccountsForUrl;
