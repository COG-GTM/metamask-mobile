


export function handleDappUrl({
  instance,
  handled,
  urlObj,
  browserCallBack





}) {
  // Enforce https
  handled();
  urlObj.set('protocol', 'https:');
  instance._handleBrowserUrl(urlObj.href, browserCallBack);
}

export default handleDappUrl;