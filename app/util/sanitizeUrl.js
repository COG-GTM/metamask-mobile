const sanitizeUrl = (url) => url?.replace(/\/$/, '');

export default sanitizeUrl;

export const compareSanitizedUrl = (urlOne, urlTwo) =>
sanitizeUrl(urlOne) === sanitizeUrl(urlTwo);