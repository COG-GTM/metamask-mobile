const sanitizeUrlInput = (url) => {
  const blacklistRegex = /^javascript:/;
  if (blacklistRegex.test(url)) {
    return '';
  }
  return url.replace(/'/g, '%27').replace(/[\r\n]/g, '');
};

export default sanitizeUrlInput;