import UrlParse from 'url-parse';

/**
 * Returns the WalletConnect v1 redirect URL only when it is an https link on
 * the approved dapp's host (or one of its subdomains). Anything else, including
 * custom schemes, credentials or other hosts, is rejected.
 */
export const getSafeWalletConnectV1RedirectUrl = (
  redirectUrl: unknown,
  approvedDappUrl: unknown,
): string | null => {
  if (
    typeof redirectUrl !== 'string' ||
    typeof approvedDappUrl !== 'string' ||
    !redirectUrl ||
    !approvedDappUrl
  ) {
    return null;
  }

  try {
    const redirect = new UrlParse(redirectUrl, {});
    const dapp = new UrlParse(approvedDappUrl, {});
    const redirectHost = redirect.hostname.toLowerCase();
    const dappHost = dapp.hostname.toLowerCase();

    if (
      redirect.protocol !== 'https:' ||
      redirect.username ||
      redirect.password ||
      !redirectHost ||
      !dappHost
    ) {
      return null;
    }

    if (redirectHost !== dappHost && !redirectHost.endsWith(`.${dappHost}`)) {
      return null;
    }

    return redirect.toString();
  } catch {
    return null;
  }
};
