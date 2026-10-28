import isUrl from 'is-url';
import URLParse from 'url-parse';
import { RootState } from '../../../reducers';
import { getActiveTabUrl } from '../../../util/transactions';
import { getPermittedAccountsByHostname } from '../../../core/Permissions';
import { selectPermissionControllerState } from '../../../selectors/snaps/permissionController';
import Logger from '../../../util/Logger';

/**
 * Accounts permitted for the active browser tab's hostname.
 * Read on demand (e.g. from an event handler) rather than via a store
 * subscription, since it parses the tab URL and walks permission caveats.
 */
export const getActiveConnectedDapp = (
  state: RootState,
): string[] | undefined => {
  const activeTabUrl = getActiveTabUrl(state);
  if (!isUrl(activeTabUrl)) return [];
  try {
    const hostname = new URLParse(activeTabUrl).hostname;
    return getPermittedAccountsByHostname(
      selectPermissionControllerState(state),
      hostname,
    );
  } catch (error) {
    Logger.error(error as Error, {
      message: 'ParseUrl::MainNavigator error while parsing URL',
    });
    return undefined;
  }
};
