import { Hex } from '@metamask/utils';
import {
  Caip25CaveatType,
  Caip25CaveatValue,
  Caip25EndowmentPermissionName,
  setEthAccounts,
  setPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
import {
  getHost,
  getUrlObj,
  prefixUrlWithProtocol,
} from '../../../util/browser';

/**
 * Takes in an incoming value and attempts to return the {@link Caip25CaveatValue}.
 *
 * @param permissions - The value to extract Caip25CaveatValue from, expected to be a {@link PermissionsRequest}
 * @returns The {@link Caip25CaveatValue}.
 */
export function getRequestedCaip25CaveatValue(
  permissions: unknown,
): Caip25CaveatValue {
  const defaultValue: Caip25CaveatValue = {
    optionalScopes: {},
    requiredScopes: {},
    isMultichainOrigin: false,
    sessionProperties: {},
  };

  // Type guard: Check if permissions is an object
  if (!permissions || typeof permissions !== 'object') {
    return defaultValue;
  }

  // Type guard: Check if the Caip25EndowmentPermissionName property exists and is an object
  const permissionEntry = (permissions as Record<string, unknown>)[
    Caip25EndowmentPermissionName
  ];
  if (!permissionEntry || typeof permissionEntry !== 'object') {
    return defaultValue;
  }

  // Type guard: Check if caveats property exists and is an array
  const caveats = (permissionEntry as Record<string, unknown>).caveats;
  if (!Array.isArray(caveats)) {
    return defaultValue;
  }

  // Find the caveat with the matching type
  const targetCaveat = caveats.find(
    (caveat) =>
      caveat &&
      typeof caveat === 'object' &&
      'type' in caveat &&
      caveat.type === Caip25CaveatType,
  );

  // Type guard: Check if the caveat has a value property
  if (
    !targetCaveat ||
    typeof targetCaveat !== 'object' ||
    !('value' in targetCaveat)
  ) {
    return defaultValue;
  }

  const caveatValue = targetCaveat.value;

  // Type guard: Ensure the value is an object with the expected shape
  if (
    !caveatValue ||
    typeof caveatValue !== 'object' ||
    !('optionalScopes' in caveatValue) ||
    !('requiredScopes' in caveatValue) ||
    !('isMultichainOrigin' in caveatValue) ||
    !('sessionProperties' in caveatValue)
  ) {
    return defaultValue;
  }

  return caveatValue as Caip25CaveatValue;
}

/**
 * Modifies the requested CAIP-25 permissions object after UI confirmation.
 *
 * @param caip25CaveatValue - The requested CAIP-25 caveat value to modify.
 * @param ethAccountAddresses - The list of permitted eth addresses.
 * @param ethChainIds - The list of permitted eth chainIds.
 */
export function getCaip25PermissionsResponse(
  caip25CaveatValue: Caip25CaveatValue,
  ethAccountAddresses: Hex[],
  ethChainIds: Hex[],
): {
  [Caip25EndowmentPermissionName]: {
    caveats: [{ type: string; value: Caip25CaveatValue }];
  };
} {
  const caveatValueWithChains = setPermittedEthChainIds(
    caip25CaveatValue,
    ethChainIds,
  );

  const caveatValueWithAccounts = setEthAccounts(
    caveatValueWithChains,
    ethAccountAddresses,
  );

  return {
    [Caip25EndowmentPermissionName]: {
      caveats: [
        {
          type: Caip25CaveatType,
          value: caveatValueWithAccounts,
        },
      ],
    },
  };
}

interface BrowserTabsState {
  activeTab?: number | null;
  tabs?: { id: number; url: string }[];
}

export interface RequestingBrowserTab {
  url?: string;
  ambiguous: boolean;
}

/**
 * Identifies the in-app browser tab that issued a request from the given
 * hostname. See {@link getBrowserTabUrlForOrigin} and
 * {@link isBrowserTabOriginAmbiguous}.
 *
 * @param browser - The browser slice of the redux state.
 * @param origin - The hostname that issued the permission request.
 * @returns The requesting tab URL (if identifiable) and an ambiguity flag.
 */
export function resolveRequestingBrowserTab(
  browser: BrowserTabsState | undefined,
  origin: string,
): RequestingBrowserTab {
  if (!origin || !browser?.tabs?.length) {
    return { ambiguous: false };
  }
  const matchingTabs = browser.tabs.filter(
    ({ url }) => Boolean(url) && getHost(url) === origin,
  );
  // BackgroundBridge only lets the active tab raise a connect prompt, so an
  // active tab on the requesting host is the requester.
  const activeMatch = matchingTabs.find(({ id }) => id === browser.activeTab);
  if (activeMatch) {
    return { url: activeMatch.url, ambiguous: false };
  }
  // Otherwise the request only carries a hostname; if tabs on that host
  // disagree on protocol we cannot tell which one asked.
  const protocols = new Set(
    matchingTabs.map(
      ({ url }) => getUrlObj(prefixUrlWithProtocol(url)).protocol,
    ),
  );
  if (protocols.size > 1) {
    return { ambiguous: true };
  }
  return { url: matchingTabs[0]?.url, ambiguous: false };
}

/**
 * Returns the URL of the in-app browser tab that issued a request from the
 * given hostname: the active tab when it is on that host, otherwise a tab on
 * that host as long as all such tabs share one protocol. Returns undefined
 * when the requesting tab cannot be identified, so callers never borrow an
 * unrelated tab's identity.
 *
 * @param browser - The browser slice of the redux state.
 * @param origin - The hostname that issued the permission request.
 * @returns The matching tab URL, if any.
 */
export function getBrowserTabUrlForOrigin(
  browser: BrowserTabsState | undefined,
  origin: string,
): string | undefined {
  return resolveRequestingBrowserTab(browser, origin).url;
}

/**
 * Whether several inactive tabs share the requesting hostname with different
 * protocols, meaning the request's protocol (and favicon) is unknown.
 *
 * @param browser - The browser slice of the redux state.
 * @param origin - The hostname that issued the permission request.
 * @returns True when the requesting tab cannot be identified.
 */
export function isBrowserTabOriginAmbiguous(
  browser: BrowserTabsState | undefined,
  origin: string,
): boolean {
  return resolveRequestingBrowserTab(browser, origin).ambiguous;
}

/**
 * Builds the URL shown in the connect sheet for a browser request. The
 * protocol comes from the requesting tab; when it is unknown because same-host
 * tabs disagree, the less trusted `http://` is shown rather than inventing
 * `https://`.
 *
 * @param origin - The hostname that issued the permission request.
 * @param requester - The result of {@link resolveRequestingBrowserTab}.
 * @returns A URL with protocol and host only.
 */
export function getRequesterDisplayUrl(
  origin: string,
  requester: RequestingBrowserTab,
): string {
  const host = getHost(requester.url || origin);
  if (requester.url) {
    const { protocol } = getUrlObj(prefixUrlWithProtocol(requester.url));
    return protocol === 'http:' ? `http://${host}` : `https://${host}`;
  }
  return requester.ambiguous ? `http://${host}` : prefixUrlWithProtocol(host);
}
