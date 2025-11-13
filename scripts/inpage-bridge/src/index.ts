
import injectInpageProvider from './provider';

if (shouldInject()) {
  injectInpageProvider();
  start();
}


/**
 * Sets up the stream communication and submits site metadata
 *
 */
async function start(): Promise<void> {
  await domIsReady();
  (window as Window & { _metamaskSetupProvider?: () => void })._metamaskSetupProvider?.();
}

/**
 * Determines if the provider should be injected.
 *
 * @returns {@code true} if the provider should be injected.
 */
function shouldInject(): boolean {
  return (
    doctypeCheck() &&
    suffixCheck() &&
    !blockedDomainCheck()
  );
}

/**
 * Checks the doctype of the current document if it exists
 *
 * @returns {@code true} if the doctype is html or if none exists
 */
function doctypeCheck(): boolean {
  const { doctype } = window.document;
  if (doctype) {
    return doctype.name === 'html';
  }
  return true;
}

/**
 * Returns whether or not the extension (suffix) of the current document is
 * prohibited.
 *
 * This checks {@code window.location.pathname} against a set of file extensions
 * that should not have the provider injected into them. This check is indifferent
 * of query parameters in the location.
 *
 * @returns whether or not the extension of the current document is prohibited
 */
function suffixCheck(): boolean {
  const prohibitedTypes = [/\.xml$/u, /\.pdf$/u];
  const currentUrl = window.location.pathname;
  for (let i = 0; i < prohibitedTypes.length; i++) {
    if (prohibitedTypes[i].test(currentUrl)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if the current domain is blocked
 *
 * @returns {@code true} if the current domain is blocked
 */
function blockedDomainCheck(): boolean {
  const blockedDomains = [
    'execution.consensys.io',
    'execution.metamask.io',
    'uscourts.gov',
    'dropbox.com',
    'webbyawards.com',
    'adyen.com',
    'gravityforms.com',
    'harbourair.com',
    'ani.gamer.com.tw',
    'blueskybooking.com',
    'sharefile.com',
    'battle.net',
  ];

  const blockedUrlPaths = [
    'cdn.shopify.com/s/javascripts/tricorder/xtld-read-only-frame.html',
  ];

  const { hostname: currentHostname, pathname: currentPathname } =
    window.location;

  const trimTrailingSlash = (str: string): string =>
    str.endsWith('/') ? str.slice(0, -1) : str;

  return (
    blockedDomains.some(
      (blockedDomain) =>
        blockedDomain === currentHostname ||
        currentHostname.endsWith(`.${blockedDomain}`),
    ) ||
    blockedUrlPaths.some(
      (blockedUrlPath) =>
        trimTrailingSlash(blockedUrlPath) ===
        trimTrailingSlash(currentHostname + currentPathname),
    )
  );
}

/**
 * Returns a promise that resolves when the DOM is loaded (does not wait for images to load)
 */
async function domIsReady(): Promise<void> {
  if (['interactive', 'complete'].includes(document.readyState)) {
    return;
  }
  await new Promise<void>((resolve) =>
    window.addEventListener('DOMContentLoaded', () => resolve(), { once: true }),
  );
}
