/**
 * Sanitizes a URL before it is interpolated into an injected JavaScript
 * single-quoted string literal (see `BrowserTab` `injectJavaScript` usage:
 * `window.location.href = '${sanitizeUrlInput(url)}';`).
 *
 * The returned value must not be able to break out of that single-quoted
 * context. Dangerous schemes (`javascript:`, `data:`) are rejected, tolerating
 * leading whitespace / control characters. Backslashes are percent-encoded
 * FIRST (before quotes) so an escape we introduce is never double-processed.
 * Single and double quotes are percent-encoded; newlines, carriage returns and
 * the JS line terminators U+2028 / U+2029 are stripped; and template-literal
 * (`` ` `` and `${`) plus `</script>`-style sequences are defensively
 * neutralized.
 *
 * Ordinary `https://` URLs pass through essentially unchanged and remain
 * usable for navigation.
 */
const sanitizeUrlInput = (url: string): string => {
  // Strip leading/trailing whitespace and control characters before checking
  // the scheme so payloads like `  data:...` or `\tjavascript:...` are caught.
  // eslint-disable-next-line no-control-regex
  const normalized = url.replace(/[\u0000-\u0020\u007f-\u009f]/g, '');
  if (/^(?:javascript|data):/i.test(normalized)) {
    return '';
  }

  return (
    url
      // Backslashes first so escapes introduced below are not double-processed.
      .replace(/\\/g, '%5C')
      .replace(/'/g, '%27')
      .replace(/"/g, '%22')
      // Newlines, carriage returns, and the U+2028 / U+2029 line terminators.
      .replace(/[\r\n\u2028\u2029]/g, '')
      // Defensive neutralization of template-literal / </script> sequences.
      .replace(/`/g, '%60')
      .replace(/\$\{/g, '%24%7B')
      .replace(/<\/script/gi, '%3C/script')
  );
};

export default sanitizeUrlInput;
