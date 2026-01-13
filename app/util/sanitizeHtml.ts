/**
 * Escapes HTML special characters to prevent XSS attacks.
 * This function converts characters that have special meaning in HTML
 * to their corresponding HTML entities.
 *
 * @param str - The string to escape
 * @returns The escaped string safe for use in HTML content
 */
export const escapeHtml = (str: string): string => {
  if (!str) {
    return '';
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // eslint-disable-next-line @metamask/design-tokens/color-no-hex
    .replace(/'/g, '&#039;');
};

/**
 * Sanitizes CSS content to prevent XSS attacks via style injection.
 * This function removes potentially dangerous CSS patterns that could
 * be used to inject scripts or perform other malicious actions.
 *
 * @param css - The CSS string to sanitize
 * @returns The sanitized CSS string
 */
export const sanitizeCss = (css: string): string => {
  if (!css) {
    return '';
  }
  return css
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/url\s*\(\s*["']?\s*javascript:/gi, 'url(')
    .replace(/@import/gi, '')
    .replace(/behavior\s*:/gi, '')
    .replace(/-moz-binding\s*:/gi, '');
};

/**
 * Sanitizes a CSS color value to prevent XSS attacks.
 * Only allows valid CSS color formats: hex, rgb, rgba, hsl, hsla, and named colors.
 *
 * @param color - The color value to sanitize
 * @returns The sanitized color value, or a default color if invalid
 */
export const sanitizeCssColor = (color: string): string => {
  if (!color) {
    return 'transparent';
  }

  const trimmedColor = color.trim();

  const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
  const rgbPattern = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+))?\s*\)$/;
  const hslPattern = /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(,\s*(0|1|0?\.\d+))?\s*\)$/;
  const namedColorPattern = /^[a-zA-Z]+$/;

  if (
    hexPattern.test(trimmedColor) ||
    rgbPattern.test(trimmedColor) ||
    hslPattern.test(trimmedColor) ||
    namedColorPattern.test(trimmedColor)
  ) {
    return trimmedColor;
  }

  return 'transparent';
};
