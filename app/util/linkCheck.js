import Url from 'url-parse';
import isUrl from 'is-url';
import { getPhishingTestResult } from './phishingDetection';

const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const DENYLISTED_DOMAINS = ['metamask.app.link'];

const isAllowedProtocol = (protocol) =>
ALLOWED_PROTOCOLS.includes(protocol);

const isAllowedUrl = ({ hostname, origin }) => {
  if (DENYLISTED_DOMAINS.includes(hostname)) {
    return false;
  }
  const phishingResult = getPhishingTestResult(origin);
  return !phishingResult?.result;
};

export const isLinkSafe = (link) => {
  try {
    const url = new Url(link);
    const { protocol, href } = url;
    return isUrl(href) && isAllowedProtocol(protocol) && isAllowedUrl(url);
  } catch (err) {
    return false;
  }
};

export default isLinkSafe;